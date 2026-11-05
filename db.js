
const mysql = require("mysql8");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Revathi@1729",
    database: "leave_management"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
        return;
    }

    console.log("Database connected successfully!");
});

module.exports = db;
