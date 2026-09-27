import mysql from "mysql2/promise";

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,

	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

export const testDatabaseConnection = async (): Promise<void> => {
	// console.log({
	// 	DB_HOST: process.env.DB_HOST,
	// 	DB_PORT: process.env.DB_PORT,
	// 	DB_USER: process.env.DB_USER,
	// 	DB_NAME: process.env.DB_NAME,
	// });
	const connection = await pool.getConnection();

	try {
		await connection.query("SELECT 1");
		console.log("MariaDB connected successfully");
	} finally {
		connection.release();
	}
};

export default pool;
