
document.addEventListener("DOMContentLoaded", () => {
    // EMPLOYEE ID DROPDOWN
const employeeSelect = document.getElementById("employee_id");

if (employeeSelect) {
    fetch("/employees")
        .then(response => response.json())
        .then(data => {
            employeeSelect.innerHTML =
                '<option value="">Select Employee ID</option>';

            data.forEach(emp => {
                const id = emp["employee id"];

                employeeSelect.add(
                    new Option(id, id)
                );
            });
        })
        .catch(error => {
            console.error("Dropdown error:", error);
            alert("Unable to load employee IDs");
        });

    employeeSelect.addEventListener("change", function () {
        fetch("/employees")
            .then(response => response.json())
            .then(data => {
                const emp = data.find(
                    e => String(e["employee id"]) === this.value
                );

                document.getElementById("name").value = emp ? emp.name : "";
                document.getElementById("email").value = emp ? emp.email : "";
            });
    });
}
    
    // ==================================
    // 2. CALCULATE NUMBER OF DAYS
    // ==================================

    const startDate = document.getElementById("start_date");
    const endDate = document.getElementById("end_date");
    const numberOfDays = document.getElementById("number_of_days");

    function calculateDays() {
        if (!startDate || !endDate || !numberOfDays) return;

        if (!startDate.value || !endDate.value) {
            numberOfDays.value = "";
            return;
        }

        const start = new Date(startDate.value + "T00:00:00");
        const end = new Date(endDate.value + "T00:00:00");

        if (end < start) {
            numberOfDays.value = "";
            endDate.setCustomValidity("End date cannot be before start date.");
            return;
        }

        endDate.setCustomValidity("");

        const difference =
            Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

        numberOfDays.value = difference;
    }

    if (startDate && endDate) {
        startDate.addEventListener("change", calculateDays);
        endDate.addEventListener("change", calculateDays);
    }

    // ==================================
    // 3. SUBMIT LEAVE APPLICATION
    // ==================================

    const insertForm = document.getElementById("insertForm");

    if (insertForm) {
        insertForm.addEventListener("submit", event => {
            event.preventDefault();

            calculateDays();

            if (!insertForm.reportValidity()) return;

            const formData = new FormData(insertForm);
            const leaveData = Object.fromEntries(formData.entries());

            fetch("/leaves", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(leaveData)
            })
                .then(async response => {
                    const message = await response.text();

                    if (!response.ok) throw new Error(message);

                    alert(message);
                    insertForm.reset();
                    numberOfDays.value = "";
                })
                .catch(error => {
                    console.error("Application error:", error);
                    alert("Unable to submit leave application: " + error.message);
                });
        });
    }

    // ==================================
    // 4. DISPLAY ALL LEAVE RECORDS
    // ==================================

    const leaveTable = document.getElementById("leaveTable");

    if (leaveTable) {
        fetch("/leaves")
            .then(response => {
                if (!response.ok) throw new Error("Failed to load records");
                return response.json();
            })
            .then(leaves => {
                leaveTable.innerHTML = "";

                if (leaves.length === 0) {
                    leaveTable.innerHTML =
                        '<tr><td colspan="7">No leave records found.</td></tr>';
                    return;
                }

                leaves.forEach(leave => {
                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${leave["employee id"]}</td>
                        <td>${leave.name}</td>
                        <td>${leave.email}</td>
                        <td>${leave["leave type"]}</td>
                        <td>${leave["number of days"]}</td>
                        <td>${leave.description}</td>
                        <td>
                            ${leave.status || "Pending"}
                            <br>
                            <button onclick="changeLeaveStatus(${leave.leave_id}, 'Approved')">
                                Approve
                            </button>
                            <button onclick="changeLeaveStatus(${leave.leave_id}, 'Rejected')">
                                Reject
                            </button>
                            <button onclick="deleteLeave(${leave.leave_id})">
                                Delete
                            </button>
                        </td>
                    `;

                    leaveTable.appendChild(row);
                });
            })
            .catch(error => {
                console.error(error);
                leaveTable.innerHTML =
                    '<tr><td colspan="7">Unable to load records.</td></tr>';
            });
    }
// ==================================
// 5. DAILY EMPLOYEE LEAVE LIST
// ==================================
const dateForm = document.getElementById("dateForm");
const dailyLeaveTable = document.getElementById("dailyLeaveTable");
const leaveDate = document.getElementById("leaveDate");
const resultMessage = document.getElementById("resultMessage");

if (dateForm && dailyLeaveTable) {

    const params = new URLSearchParams(window.location.search);
    const selectedDate = params.get("leaveDate");

    if (selectedDate) {
        leaveDate.value = selectedDate;
        dateForm.requestSubmit();
    }

    dateForm.addEventListener("submit", event => {
        event.preventDefault();

        const selected = leaveDate.value;

        if (!selected) return;

        fetch("/leaves")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Unable to load leave records");
                }
                return response.json();
            })
            .then(leaves => {

                dailyLeaveTable.innerHTML = "";

                const filtered = leaves.filter(leave => {

                    const start = String(leave["start date"]).slice(0, 10);
                    const end = String(leave["end date"]).slice(0, 10);

                    return start <= selected && end >= selected;
                });

                if (filtered.length === 0) {
                    dailyLeaveTable.innerHTML = `
                        <tr>
                            <td colspan="6">
                                No employees are on leave on this date.
                            </td>
                        </tr>
                    `;

                    resultMessage.textContent = "No records found.";
                    return;
                }

                filtered.forEach(leave => {

                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${leave["employee id"]}</td>
                        <td>${leave.name}</td>
                        <td>${leave.email}</td>
                        <td>${leave["leave type"]}</td>
                        <td>${leave["number of days"]}</td>
                        <td>${leave.description}</td>
                    `;

                    dailyLeaveTable.appendChild(row);
                });

                resultMessage.textContent =
                    filtered.length + " employee leave record(s) found.";

            })
            .catch(error => {
                console.error("Daily leave error:", error);
                resultMessage.textContent = error.message;
            });
    });
}

    // ==================================
    // 5. APPROVED LEAVES
    // ==================================

    const approvedTable = document.getElementById("approvedTable");

    if (approvedTable) {
        loadStatusRecords("Approved", approvedTable);
    }

    // ==================================
    // 6. REJECTED LEAVES
    // ==================================

    const rejectedTable = document.getElementById("rejectedTable");

    if (rejectedTable) {
        loadStatusRecords("Rejected", rejectedTable);
    }

    // ==================================
    // 7. EMPLOYEES LIST
    // ==================================

    const employeesTable = document.getElementById("employeesTable");

    if (employeesTable) {
        fetch("/employees")
            .then(response => response.json())
            .then(employees => {
                employeesTable.innerHTML = "";

                if (employees.length === 0) {
                    employeesTable.innerHTML =
                        '<tr><td colspan="3">No employees found.</td></tr>';
                    return;
                }

                employees.forEach(employee => {
                    const row = document.createElement("tr");

                    const idCell = document.createElement("td");
                    const nameCell = document.createElement("td");
                    const emailCell = document.createElement("td");

                    idCell.textContent = employee["employee id"];
                    nameCell.textContent = employee.name;
                    emailCell.textContent = employee.email;

                    row.append(idCell, nameCell, emailCell);
                    employeesTable.appendChild(row);
                });
            })
            .catch(error => {
                console.error(error);
                employeesTable.innerHTML =
                    '<tr><td colspan="3">Unable to load employees.</td></tr>';
            });
    }
});

// ==================================
// 8. LOAD APPROVED / REJECTED RECORDS
// ==================================

function loadStatusRecords(status, table) {
    fetch("/leaves")
        .then(response => response.json())
        .then(leaves => {
            table.innerHTML = "";

            const filtered = leaves.filter(
                leave => leave.status === status
            );

            if (filtered.length === 0) {
                table.innerHTML =
                    '<tr><td colspan="7">No ' + status.toLowerCase() +
                    ' leave records found.</td></tr>';
                return;
            }

            filtered.forEach(leave => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${leave.leave_id}</td>
                    <td>${leave["employee id"]}</td>
                    <td>${leave.name}</td>
                    <td>${leave.email}</td>
                    <td>${leave["leave type"]}</td>
                    <td>${leave["number of days"]}</td>
                    <td>${leave.description}</td>
                `;

                table.appendChild(row);
            });
        })
        .catch(error => {
            console.error(error);
            table.innerHTML =
                '<tr><td colspan="7">Unable to load records.</td></tr>';
        });
}

// ==================================
// 9. APPROVE OR REJECT LEAVE
// ==================================

function changeLeaveStatus(id, status) {
    if (!confirm("Are you sure you want to mark this leave as " + status + "?")) {
        return;
    }

    fetch(`/leaves/status/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
    })
        .then(async response => {
            const message = await response.text();

            if (!response.ok) throw new Error(message);

            alert(message);
            location.reload();
        })
        .catch(error => {
            console.error(error);
            alert("Unable to update leave status: " + error.message);
        });
}

// ==================================
// 10. DELETE LEAVE APPLICATION
// ==================================

function deleteLeave(id) {
    if (!confirm("Are you sure you want to delete this leave record?")) {
        return;
    }

    fetch(`/leaves/${id}`, {
        method: "DELETE"
    })
        .then(async response => {
            const message = await response.text();

            if (!response.ok) throw new Error(message);

            alert(message);
            location.reload();
        })
        .catch(error => {
            console.error(error);
            alert("Unable to delete record: " + error.message);
        });
}

