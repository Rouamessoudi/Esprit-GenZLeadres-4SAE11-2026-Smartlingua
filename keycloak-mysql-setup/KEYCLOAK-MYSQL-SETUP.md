# Keycloak MySQL Setup (Windows)

Step-by-step guide to migrate Keycloak from embedded H2 to MySQL.

---

## Prerequisites

- **Keycloak** installed (e.g. `C:\keycloak-25` or similar)
- **MySQL** running locally (XAMPP, WAMP, or standalone)
- MySQL root access

---

## Step 1: Create MySQL Database and User

Open **Command Prompt** or **PowerShell** and run:

```bash
mysql -u root -p
```

Enter your MySQL root password, then paste and execute:

```sql
CREATE DATABASE IF NOT EXISTS keycloak
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'keycloak_user'@'localhost' IDENTIFIED BY 'keycloak_pass';

GRANT ALL PRIVILEGES ON keycloak.* TO 'keycloak_user'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

**Alternative:** Run the SQL file directly:

```bash
mysql -u root -p < create-keycloak-db.sql
```

---

## Step 2: Stop Keycloak (Avoid H2 "File Locked" Errors)

Before switching to MySQL, stop any running Keycloak instance:

### Option A: If Keycloak runs in a CMD window
- Go to the CMD window where Keycloak is running
- Press **Ctrl+C**
- Wait until the process exits

### Option B: Kill by process
```powershell
# Find Keycloak process
tasklist | findstr java

# Kill by PID (replace 12345 with actual PID)
taskkill /F /PID 12345
```

### Option C: Kill all Java processes (use with caution)
```powershell
taskkill /F /IM java.exe
```

---

## Step 3: Copy the Startup Script to Keycloak

1. Copy `start-keycloak-mysql.bat` to your Keycloak **bin** folder, e.g.:
   ```
   C:\keycloak-25\bin\start-keycloak-mysql.bat
   ```

2. Or run it from the Keycloak bin folder:
   ```cmd
   cd C:\keycloak-25\bin
   start-keycloak-mysql.bat
   ```

---

## Step 4: Start Keycloak with MySQL

### Using the batch script (recommended)

1. Open CMD
2. Go to Keycloak bin folder:
   ```cmd
   cd C:\keycloak-25\bin
   ```
3. Run:
   ```cmd
   start-keycloak-mysql.bat
   ```

### Manual command

```cmd
cd C:\keycloak-25\bin

kc.bat start-dev --db=mysql --db-url="jdbc:mysql://localhost:3306/keycloak?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" --db-username=keycloak_user --db-password=keycloak_pass
```

---

## Step 5: Verify

1. Wait for Keycloak to start (look for "Running the server in development mode").
2. Open: http://localhost:8080
3. Create an admin user if first run.
4. Create realm `smartlingua` and client `angular` as before.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| H2 file locked | Stop Keycloak with Ctrl+C or `taskkill /F /PID <pid>` before starting with MySQL |
| Access denied for keycloak_user | Re-run the SQL commands, check password |
| Unknown database 'keycloak' | Run `create-keycloak-db.sql` |
| MySQL not running | Start MySQL (XAMPP Control Panel, WAMP, or `net start mysql`) |

---

## Summary

| Item | Value |
|------|-------|
| Database | keycloak |
| User | keycloak_user |
| Password | keycloak_pass |
| JDBC URL | jdbc:mysql://localhost:3306/keycloak?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC |
