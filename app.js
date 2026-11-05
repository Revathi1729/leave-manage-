
const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Get all leave applications
app.get("/leaves", (req, res) => {
    db.query("SELECT * FROM `employee leaves` ORDER BY leave_id DESC",
        (err, results) => {
            if (err) return res.status(500).send(err.message);
            res.json(results);
        });
});

// Get employee IDs for dropdown
app.get("/employees", (req, res) => {
    const sql = `SELECT DISTINCT \`employee id\`, name, email
                 FROM \`employee leaves\``;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});

// Get one employee's leave history
app.get("/leaves/employee/:id", (req, res) => {
    const sql = `SELECT * FROM \`employee leaves\`
                 WHERE \`employee id\` = ?
                 ORDER BY leave_id DESC`;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});

// Apply for leave
app.post ("/leaves", (req, res) => {
    console.log("LEAVE FORM SUBMISSION RECEIVED");
    const {
        employee_id,
        name,
        email,
        leave_type,
        number_of_days,
        description,
        start_date,
        end_date
    } = req.body;

    const sql = `INSERT INTO \`employee leaves\`
    (\`employee id\`, name, email, \`leave type\`,
     \`number of days\`, description, \`start date\`,
     \`end date\`, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [
        employee_id,
        name,
        email,
        leave_type,
        number_of_days,
        description,
        start_date,
        end_date,
        "Pending"
    ], (err, result) => {
        if (err) {
            console.log("MYSQL ERROR:", err);
            return res.status(500).send(err.message);
        }

        res.send("Leave application submitted successfully!");
    });
});
// Manager approves or rejects a leave
app.put("/leaves/status/:id", (req, res) => {
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).send("Invalid status");
    }

    const sql = `UPDATE \`employee leaves\`
                 SET status = ? WHERE leave_id = ?`;

    db.query(sql, [status, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (!result.affectedRows) {
            return res.status(404).send("Leave application not found");
        }
        res.send("Leave status updated successfully!");
    });
});

// Manager modifies a leave application
app.put("/leaves/:id", (req, res) => {
    const {
        leave_type, number_of_days, description,
        start_date, end_date
    } = req.body;

    const sql = `UPDATE \`employee leaves\`
SET \`leave type\` = ?, \`number of days\` = ?,
    description = ?, \`start date\` = ?, \`end date\` = ?
WHERE leave_id = ?`;

    db.query(sql, [
        leave_type, number_of_days, description,
        start_date, end_date, req.params.id
    ], (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (!result.affectedRows) {
            return res.status(404).send("Leave application not found");
        }
        res.send("Leave application modified successfully!");
    });
});

// Delete a leave application
app.delete("/leaves/:id", (req, res) => {
    db.query(
        "DELETE FROM `employee leaves` WHERE leave_id = ?",
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).send(err.message);
            if (!result.affectedRows) {
                return res.status(404).send("Leave application not found");
            }
            res.send("Leave application deleted successfully!");
        }
    );
});

console.log("UPDATED APP.JS IS RUNNING");
// Update leave record
app.put("/leaves/:id", (req, res) => {
    const id = req.params.id;

    const {
        leave_type,
        start_date,
        end_date,
        number_of_days,
        description
    } = req.body;

    const sql = `
        UPDATE \`employee leaves\`
        SET
            \`leave type\` = ?,
            \`start date\` = ?,
            \`end date\` = ?,
            \`number of days\` = ?,
            description = ?
        WHERE leave_id = ?
    `;

    db.query(sql, [
        leave_type,
        start_date,
        end_date,
        number_of_days,
        description,
        id
    ], (err, result) => {
        if (err) return res.status(500).send(err.message);
        res.json({ message: "Leave updated successfully" });
    });
});


// Employee leave history
app.get("/employee-history/:id", (req, res) => {
    const sql = `
        SELECT * FROM \`employee leaves\`
        WHERE \`employee id\` = ?
        ORDER BY leave_id DESC
    `;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
