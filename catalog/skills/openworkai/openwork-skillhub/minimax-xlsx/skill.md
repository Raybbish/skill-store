---
name: minimax-xlsx
description: Open, create, read, analyze, edit, or validate Excel and other spreadsheet files (.xlsx, .xlsm, .csv, .tsv). Covers building new workbooks from scratch, analyzing existing ones, lossless edits, formula recalculation/validation, and professional financial formatting.
description_en: "Create, edit, and analyze Excel spreadsheets"
version: 1.0.0
display_name: "minimax-xlsx"
tags:
  - excel
  - spreadsheet
  - xlsx
  - data
visibility: public
---

# MiniMax XLSX

Handle the request directly — do not spawn sub-agents — and always write the output file the user asked for.

## Task routing
| Task | Method | Guide |
| --- | --- | --- |
| **READ** — analyze existing data | `xlsx_reader.py` + pandas | `references/read-analyze.md` |
| **CREATE** — new xlsx from scratch | XML template | `references/create.md` + `references/format.md` |
| **EDIT** — modify an existing xlsx | unpack → edit → pack | `references/edit.md` |
| **FIX** — repair broken formulas | unpack → fix `<f>` → pack | `references/fix.md` |
| **VALIDATE** — check formulas | `formula_check.py` | `references/validate.md` |

## READ
Start with `xlsx_reader.py` to discover structure, then pandas for custom analysis. Never modify the source file.
- **Decimals:** if the user asks for N decimal places, apply that format to every number (`f'{v:.2f}'`); never emit `12875` when `12875.00` is required.
- **Aggregation:** compute sums/means/counts straight from the DataFrame column (`df['Revenue'].sum()`); don't re-derive values first.

## CREATE
Copy `templates/minimal_xlsx/`, edit the XML directly, and pack with `xlsx_pack.py`. Every derived value MUST be an Excel formula (`<f>SUM(B2:B9)</f>`), never a hardcoded number. Apply font colors per `references/format.md`.

## EDIT — integrity rules (critical)
1. **Never create a new `Workbook()`** for an edit. Always load the original file.
2. Output MUST keep the **same sheets** (names + data) as the input.
3. Change only the specific cells the task asks for; leave everything else untouched.
4. After saving, **verify** with `xlsx_reader.py` or pandas that sheet names and a sample of original data survived. If not, you wrote the wrong file — fix before delivering.

Never openpyxl round-trip an existing file (it corrupts VBA, pivots, sparklines). Use unpack → helper scripts → repack.

**Fill / add formulas to existing cells = EDIT.** Use the XML edit path; never `new Workbook()`. Example — put a cross-sheet SUM in B3:
```bash
python3 SKILL_DIR/scripts/xlsx_unpack.py input.xlsx /tmp/xlsx_work/
# locate the sheet XML via xl/workbook.xml → xl/_rels/workbook.xml.rels
# add <f> inside the target <c>:
#   <c r="B3"><f>SUM('Sales Data'!D2:D13)</f><v></v></c>
python3 SKILL_DIR/scripts/xlsx_pack.py /tmp/xlsx_work/ output.xlsx
```

**Add a column** (formulas, number format, and styles copy from the adjacent column):
```bash
python3 SKILL_DIR/scripts/xlsx_unpack.py input.xlsx /tmp/xlsx_work/
python3 SKILL_DIR/scripts/xlsx_add_column.py /tmp/xlsx_work/ --col G \
    --sheet "Sheet1" --header "% of Total" \
    --formula '=F{row}/$F$10' --formula-rows 2:9 \
    --total-row 10 --total-formula '=SUM(G2:G9)' --numfmt '0.0%' \
    --border-row 10 --border-style medium
python3 SKILL_DIR/scripts/xlsx_pack.py /tmp/xlsx_work/ output.xlsx
```
`--border-row` draws a top border across the whole row (not just the new column) — use it for accounting-style total lines.

**Insert a row** (shifts rows, rewires SUM formulas, fixes circular refs):
```bash
python3 SKILL_DIR/scripts/xlsx_unpack.py input.xlsx /tmp/xlsx_work/
# Find --at by searching the worksheet XML for the label text, NOT the prompt's
# row number (the prompt may say "row 5 (Office Rent)" but the label is at row 4).
python3 SKILL_DIR/scripts/xlsx_insert_row.py /tmp/xlsx_work/ --at 5 \
    --sheet "Budget FY2025" --text A=Utilities \
    --values B=3000 C=3000 D=3500 E=3500 \
    --formula 'F=SUM(B{row}:E{row})' --copy-style-from 4
python3 SKILL_DIR/scripts/xlsx_pack.py /tmp/xlsx_work/ output.xlsx
```

**Row-wide borders** (e.g. a TOTAL line): after the helper scripts, append a `<border>` in `xl/styles.xml` and a matching `<xf>` clone in `<cellXfs>` that sets `borderId`, then apply that style index to every `<c>` in the row via the `s` attribute. Iterate all cells A→last column, not just the new ones.

**Manual XML edit** (anything the helpers don't cover):
```bash
python3 SKILL_DIR/scripts/xlsx_unpack.py input.xlsx /tmp/xlsx_work/
# edit XML …
python3 SKILL_DIR/scripts/xlsx_pack.py /tmp/xlsx_work/ output.xlsx
```

## FIX
An EDIT task: unpack → repair broken `<f>` nodes → pack. Preserve all sheets and data.

## VALIDATE
Run `formula_check.py` for static checks; use `libreoffice_recalc.py` for live recalculation when available.

## Financial color standard
| Cell role | Font color | Hex |
| --- | --- | --- |
| Hard-coded input / assumption | Blue | `0000FF` |
| Formula / computed result | Black | `000000` |
| Cross-sheet reference formula | Green | `00B050` |

## Key rules
1. **Formula-first:** every calculated cell uses an Excel formula, not a hardcoded number.
2. **CREATE → XML template:** copy, edit XML, pack with `xlsx_pack.py`.
3. **EDIT → XML:** never openpyxl round-trip; use unpack/edit/pack.
4. **Always produce the output file** — top priority.
5. **Validate before delivery:** `formula_check.py` exit 0 = safe.

## Utility scripts
```bash
python3 SKILL_DIR/scripts/xlsx_reader.py input.xlsx                  # structure discovery
python3 SKILL_DIR/scripts/formula_check.py file.xlsx --json         # formula validation
python3 SKILL_DIR/scripts/formula_check.py file.xlsx --report       # standardized report
python3 SKILL_DIR/scripts/xlsx_unpack.py in.xlsx /tmp/work/          # unpack for XML editing
python3 SKILL_DIR/scripts/xlsx_pack.py /tmp/work/ out.xlsx           # repack after editing
python3 SKILL_DIR/scripts/xlsx_shift_rows.py /tmp/work/ insert 5 1   # shift rows for insertion
python3 SKILL_DIR/scripts/xlsx_add_column.py /tmp/work/ --col G ...  # add column w/ formulas
python3 SKILL_DIR/scripts/xlsx_insert_row.py /tmp/work/ --at 6 ...    # insert row w/ data
```
