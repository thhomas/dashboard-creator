export const dynamic = 'force-dynamic';

import Link from "next/link";
import { SlashCircle, ClipboardData, PlusCircleDotted, CodeSlash } from 'react-bootstrap-icons';

import DeleteButton from '@/app/components/deleteButton'
import { loadDashboards } from '@/app/utils/loadDashboards'

async function Home() {

  const data = await loadDashboards()

  return (
    <div id="page-content-wrapper">
      <div className="container-fluid mt-5 mt-sm-0">
        <div className="p-1 p-md-3">
          <h1>Welcome</h1>
          <p>Generate SDMX dashboards from YAML definition files.</p>
          <div className="list-group list-group-flush">
            {
              (data.length > 0 ?
                (
                  data.map((item: any) => (
                    <div className='list-group-item list-group-item-action p-3' key={item.uri}>
                      <Link
                        href={`/chart/${item.uri}`}
                        title={`Last updated on ${new Date(item.date).toString()}`}
                        className=''
                        prefetch={false}
                      >
                        <ClipboardData className="me-2" />{item.name}
                      </Link>
                      <DeleteButton uri={item.uri} />
                      <Link
                        href={`/api/yaml/${item.uri}`}
                        target='_blank'
                        className='btn btn-info btn-sm float-end me-2'
                        prefetch={false}
                      >
                        <CodeSlash />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="list-group-item text-center py-4 text-muted"><SlashCircle className="me-2" />No YAML file found</div>
                )
              )
            }
            <Link
              href='/upload'
              className='list-group-item list-group-item-action p-3'
            >
              <PlusCircleDotted className="me-2" />Upload new file
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

}

export default Home;