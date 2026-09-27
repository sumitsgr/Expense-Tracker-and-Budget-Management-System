import mysql from "mysql2/promise";

async function test() {
	try {
		console.log("Connecting...");

		const connection = await mysql.createConnection({
			host: "127.0.0.1",
			port: 3306,
			user: "trackerbudgetdb",
			password: process.env.DB_PASSWORD,
			database: "trackerbudgetdb",
		});

		console.log("CONNECTED!");

		const [rows] = await connection.query("SELECT USER(), CURRENT_USER(), @@hostname, @@port, VERSION()");

		console.log(rows);

		await connection.end();
	} catch (error) {
		console.error("FAILED:");
		console.error(error);
	}
}

test();
