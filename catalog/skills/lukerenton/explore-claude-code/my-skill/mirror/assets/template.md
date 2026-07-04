# assets/ - Static Resources

This directory holds static resources that the skill can reference. Things Claude reads or fills in but does not execute.

## What Goes Here

- **Templates**: Document templates, config file templates, boilerplate structures Claude fills in for each use
- **Schemas**: JSON schemas, database schemas, API response shapes
- **Data files**: Lookup tables, mapping files, reference data
- **Images**: Diagrams, example screenshots (Claude can view images)
- **Example outputs**: Sample files showing the expected format

## How It Works

SKILL.md references assets when needed:

"Use the template at [assets/template.md](assets/template.md) as the starting point."

Claude reads the asset, fills in the dynamic parts, and produces the output. Assets are static. They do not change between invocations.

## Example Use Cases

- A PR template that Claude fills in with the actual changes
- A config schema that Claude validates against
- A component boilerplate that Claude customises per request