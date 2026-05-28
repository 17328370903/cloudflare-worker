// 后端测试页面 - 演示如何操作数据库
import {update} from "@/lib/database"

export default async function Blog() {


  const result = await update("UPDATE users SET name = ? WHERE id = ?",['更新用户',1]);

  console.log(result);



	return "blog";
}