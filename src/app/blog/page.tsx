import {getCloudflareContext} from "@opennextjs/cloudflare";

export default async function Blog() {

    const {env} = getCloudflareContext()

    const stmt = env.test_db.prepare(`SELECT * FROM Customers limit 1`);

    const result = await stmt.all();
    console.log(result.results,1,2,3)

    return (
        <div>
            <div>blog</div>
        </div>
    )
}