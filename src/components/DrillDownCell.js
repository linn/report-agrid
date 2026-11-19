import React from 'react';
import { Link } from 'react-router-dom';

// A cell attribute's value (the backend's text-colour, background-colour, ...), if it has one.
export const attributeValue = (attributes, type) =>
    attributes?.find(a => a.attributeType === type)?.attributeValue;

// A cell's value, as a link when the report gives it a drill-down: an <a> for an external link,
// a router <Link> otherwise.
function DrillDownCell({ value, valueFormatted, data, colDef, context }) {
    const text = valueFormatted ?? value;
    const drillDown = data?.[`${colDef.field}DrillDown`];
    if (!drillDown?.url) {
        return text;
    }

    const { openLinksInNewTabs } = context;
    const linkProps = {
        target: openLinksInNewTabs ? '_blank' : '',
        rel: openLinksInNewTabs ? 'noopener noreferrer' : '',
        // a drill-down link takes its cell's colour, not the browser's link colour
        style: { color: attributeValue(data[`${colDef.field}Attributes`], 'text-colour') }
    };

    return drillDown.external ? (
        <a href={drillDown.url} {...linkProps}>
            {text}
        </a>
    ) : (
        <Link to={drillDown.url} {...linkProps}>
            {text}
        </Link>
    );
}

export default DrillDownCell;
