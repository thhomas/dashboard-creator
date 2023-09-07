import { useEffect, useState } from "react";
import { parseOperandTextExpr, parseTextExpr } from '@/app/utils/parseTextExpr';
import { SDMXParser } from 'sdmx-json-parser';
import { parseDataExpr } from "@/app/utils/parseDataExpr";

const Value = ({ config, loadedCallback }) => {

    const [titleObject, setTitleObject] = useState({ text: "Loading..." })
    const [subTitleObject, setSubTitleObject] = useState({ text: "Loading..." })
    const [valueStr, setValueStr] = useState("Loading...")

    const sdmxParser = new SDMXParser();

    useEffect(() => {
        const dataObjs = parseDataExpr(config.DATA);
        if(dataObjs.length > 1) {
            throw new Error('Multiple data expressions are not supported for Value component');
        }
        const dataObj = dataObjs[0];

        const dataFlowUrl = dataObj.dataFlowUrl;
        sdmxParser.getDatasets(dataFlowUrl, {
            headers: new Headers({
                Accept: "application/vnd.sdmx.data+json;version=2.0.0",
            })
        }).then(() => {
            const data = sdmxParser.getData();
            const dimensions = sdmxParser.getRawDimensions();
            const attributes = sdmxParser.getAttributes();

            const titleObj = parseTextExpr(config.Title, dimensions);
            const subTitleObj = parseTextExpr(config.Subtitle, dimensions);
            setTitleObject(titleObj);
            setSubTitleObject(subTitleObj);

            let valueStr = data[0].value;
            // apply operators to data
            if(dataObj.operator) {
                // get operand value
                // if operand starts with { then it is an attribute
                if(dataObj.operand.startsWith('{')) {
                    const operandValue = parseOperandTextExpr(dataObj.operand, data[0], attributes);
                    valueStr = eval(`${valueStr} ${dataObj.operator} ${operandValue}`);
                }

            }
            if (config['Decimals']) {
                //const decimalNumber = parseInt(parseTextExpr(config['Decimals'], attributes)['text']); 
                const decimalNumber = parseOperandTextExpr(config['Decimals'], data[0], attributes);
                valueStr = valueStr.toFixed(decimalNumber);
            }
            if (config['Unit']) {
                if (config['unitLoc'] == 'SUFFIX') {
                    valueStr += config['Unit'];
                } else if (config['unitLoc'] == 'PREFIX') {
                    valueStr = config['Unit'] + valueStr;
                }
            }

            setValueStr(valueStr.toLocaleString());

            loadedCallback(true)
        });
    }, []);

    return (
        <div className="pt-3 pb-2 px-2 px-xl-3 bg-white">
            <h2 className={`${titleObject.bootstrapcss && titleObject.bootstrapcss.join(' ')}`} style={titleObject.inlinecss}>{titleObject.text}</h2>
            {subTitleObject['text'] && (<h4 className={`${subTitleObject.bootstrapcss && subTitleObject.bootstrapcss.join(' ')}`} style={subTitleObject.inlinecss}>{subTitleObject.text}</h4>)}
            <span>{valueStr}</span>
        </div>

    )
}
export default Value;