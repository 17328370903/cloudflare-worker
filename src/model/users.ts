import { insert,query ,DbResult} from "../lib/database";

export interface User {
	id: number;
	email: string;
	password: string;
	name: string;
	github_id: string;
	created_at: Date;
	updated_at: Date;
	last_login_time: Date;
	last_login_ip: string;
}

export async function addUser(user: User) :Promise<number> {
    const result = await insert(
        "INSERT INTO users (email, password, name, github_id) VALUES (?, ?, ?, ?)",
        [user.email, user.password, user.name, user.github_id]
    ) as DbResult;

    if (!result.success || result.meta.changes !== 1) {
        throw new Error("Failed to add user");
    }
    return result.meta.last_row_id;
}

export async function getUserByEmail(email: string) :Promise<User | null> {
    const result = await query(
        "SELECT * FROM users WHERE email = ?",
        [email]
    ) as DbResult;

    if (!result.success || result.meta.rows_read !== 1) {
        return null;
    }
    return result.results[0] as User;
}


export async function getUserByGithubId(githubId: number) :Promise<User | null> {
    const result = await query(
        "SELECT * FROM users WHERE github_id = ?",
        [githubId]
    ) as DbResult;

    if (!result.success || result.meta.rows_read !== 1) {
        return null
    }
    return result.results[0] as User;
}