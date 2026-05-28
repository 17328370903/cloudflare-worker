// 后端测试页面 - 演示如何操作数据库

import { getCloudflareContext } from '@opennextjs/cloudflare';

export default async function Blog() {


const {env} = getCloudflareContext();

console.log(env);

	return "blog";
}