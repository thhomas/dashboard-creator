import { NextResponse, NextRequest } from "next/server";
import { revalidatePath } from 'next/cache'
import { loadUserGists } from "@/app/utils/loadYamlFromGists";
import path from "path";
import fs, { promises as fsp } from "fs";
import { revalidateTag } from "next/cache"

const configFolderPath = path.join(process.cwd(), "/public/uploads");

/**
 * 
 * @param NextRequest Get the config file content as raw YAML specified in the URL
 * @param name name of the file to load
 * @returns text (YAML) 
 */
export async function GET(request: NextRequest, { params }: { params: any }) {
    try {
        if (process.env.GIST_TOKEN) {
            const gistjson = await loadUserGists()
            if (!gistjson.length) {
                return undefined // nothing found
            }
            // Reaching this point means we got a result from the Github API
            // Filter out by file name not matching dashboard.<DashID>.yaml
            const yamlfiles = gistjson
                .filter((item: any) => Object.keys(item.files)[0] === `dashboard.${params.name}.yaml`)

            // return raw text of dashboard.*.yaml from Gist by fetching raw url from Github API
            return NextResponse.redirect(yamlfiles[0].files[`dashboard.${params.name}.yaml`].raw_url)
        } else {
            return NextResponse.redirect(`${request.nextUrl.protocol}${request.nextUrl.host}/uploads/${params.name}.yaml`)
        }
    } catch (error) {
        console.error(error)
        return <>Error loading file `${params.name}.yaml`</>
    }

}

/**
 * 
 * @param NextRequest Delete the config file content specified in the URL
 * @param name name of the file to delete
 * @returns text (YAML) 
 */
export async function DELETE(request: NextRequest, { params }: { params: any }) {
    try {
        if (process.env.GIST_TOKEN) {
            // delete gist
            const gistjson = await loadUserGists()
            if (!gistjson.length) {
                return undefined // nothing found
            }
            // Reaching this point means we got a result from the Github API
            // Filter out by file name not matching dashboard.<DashID>.yaml
            const yamlfiles = gistjson
                .filter((item: any) => Object.keys(item.files)[0] === `dashboard.${params.name}.yaml`)

            // delete gist
            await fetch(`https://api.github.com/gists/${yamlfiles[0].id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${process.env.GIST_TOKEN}`
                }
            });

            // Revalidate gist fetching cache
            revalidateTag('dashboards');

        } else {
            await fsp.unlink(path.join(configFolderPath, `${params.name}.yaml`))
        }

        // Revalidate cache on successful deletion
        revalidatePath('/')
        revalidatePath('/chart/[dashfile]')

        return NextResponse.redirect(`${request.nextUrl.protocol}${request.nextUrl.host}/`)
    }
    catch (error) {
        console.error(error)
        return NextResponse.json({ error: `Error deleting file ${params.name}.yaml` }, { status: 500 })
    }
}