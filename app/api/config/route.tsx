import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs, { promises as fsp } from "fs";

import Ajv from "ajv/dist/2020"

import { saveConfigAsGist } from "@/app/utils/saveConfigAsGist";

import { loadDashboards } from '@/app/utils/loadDashboards'
import { revalidateTag, revalidatePath } from "next/cache";

const configFolderPath = path.join(process.cwd(), "/public/uploads");
const schemaFolderPath = path.join(process.cwd(), "/public/schema");

/**
 * Load list of config files from uploads folder or Github Gist
 * @param NextRequest Get list of dashboard configurations
 * @returns json 
 */
export async function GET(request: NextRequest) {

    const data = await loadDashboards()

    if (data === false) {
        return NextResponse.json({ error: 'Error loading files from Github' }, { status: 500 });
    } else {
        return NextResponse.json(data);
    }

}

/**
 * Save a new config file to uploads folder or Github Gist
 * @param NextRequest Post a new config file
 * @returns json 
 */
export async function POST(request: NextRequest) {

    const formData = await request.formData();
    const configfile = formData.get('configfile') as Blob | null;

    // a file has indeed been submitted
    if (!configfile) {
        // No file submitted
        return NextResponse.json({ error: `No file provided. Please select one.` }, { status: 500 });
    }

    // data minumim stuff
    type ConfigData = {
        id: string
    }

    // Init data
    let buffer
    let jsonstring = ''
    let data: ConfigData

    try {
        // load file as Buffer
        const bytes = await configfile.arrayBuffer();
        buffer = Buffer.from(bytes);
        jsonstring = buffer.toString('utf8');
        // parse JSON
        data = await JSON.parse(jsonstring) as ConfigData
    } catch (error) {
        // error parsing data
        return NextResponse.json({
            error: `Config is not in JSON format, or JSON can not be parsed (syntax errors).`
        }, { status: 500 });
    }

    // Validate JSON

    try {
        // load schemas
        const schemaRoot = await JSON.parse(fs.readFileSync(path.join(schemaFolderPath, 'dashboard.schema.json'), "utf8"))
        const schemaText = await JSON.parse(fs.readFileSync(path.join(schemaFolderPath, 'dashboard.text.schema.json'), "utf8"))

        // initialize validator
        const ajv = new Ajv({
            allErrors: true,
            coerceTypes: true,
            useDefaults: true
        });

        ajv.addSchema(schemaText, "dashboard.text.schema.json")

        const validate = ajv.compile(schemaRoot);
        const valid = validate(data);

        if (!valid) {
            /*
            Parse array of errors (object) coming back as:
            {
                instancePath: '/rows/1/columns/0',
                schemaPath: '#/properties/rows/items/properties/columns/items/required',
                keyword: 'required',
                params: { missingProperty: 'type' },
                message: "must have required property 'type'"
            }
            */
            let messages = []
            if (validate.errors) {
                for (let i = 0; i < validate.errors.length; i++) {
                    messages.push(validate.errors[i]['instancePath'] + ': ' + validate.errors[i]['message'])
                }
            }
            if (!messages.length) {
                messages.push('Uknown error.')
            }
            return NextResponse.json({
                error: `Configuration file does not comply with JSON schema.`,
                report: messages
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({
            error: `Error running JSON validator.`
        }, { status: 500 });
    }

    // Save Dashboard config locally or as a Gist 
    try {
        if (process.env.GIST_TOKEN) {
            // Save config file in github gist
            const gist = await saveConfigAsGist(
                data.id,
                jsonstring,
                process.env.GIST_PUBLIC == 'true' || process.env.GIST_PUBLIC == '1'
            );
            // revalidate fetch call for gists
            revalidateTag('dashboards');
        } else {
            // Fallback, save file in uploads folder
            // DashID is any string composed of numbers, letters, and underscores (_) 
            // Filename should not have spaces, but just in case, replace them with dashes
            const finalname = `${data.id.replace(' ', '-')}.json`;
            fs.writeFileSync(`${configFolderPath}/${finalname}`, buffer);
        }
        // Revalidate cache on successful upload
        revalidatePath('/')
        revalidatePath('/chart/[dashfile]')
        // Return success message
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({
            error: `Error saving file: ${error}`
        }, { status: 500 });
    }

}
