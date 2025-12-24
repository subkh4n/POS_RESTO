/**
 * User Module - Authentication & User Management
 * File terpisah untuk handling user login dan management
 */

// ========== USER SHEET CONFIGURATION ==========
const USERS_SHEET_NAME = "Users";
const SESSION_DURATION_HOURS = 8;

// ========== USER AUTHENTICATION FUNCTIONS ==========

/**
 * Handle user login
 * @param {Object} credentials - {username, password}
 * @returns {Object} Login response with user data
 */
function handleLogin(credentials) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let usersSheet = ss.getSheetByName(USERS_SHEET_NAME);

    // Create Users sheet if not exists with default admin
    if (!usersSheet) {
      usersSheet = createUsersSheet(ss);
    }

    if (usersSheet.getLastRow() < 2) {
      return createUserJsonResponse({
        success: false,
        message: "Tidak ada user terdaftar",
      });
    }

    const rows = usersSheet.getDataRange().getValues();
    const headers = rows[0];

    // Find column indexes
    const usernameCol = headers.indexOf("username");
    const passwordCol = headers.indexOf("password");
    const idCol = headers.indexOf("id");
    const nameCol = headers.indexOf("name");
    const roleCol = headers.indexOf("role");
    const emailCol = headers.indexOf("email");
    const phoneCol = headers.indexOf("phone");
    const avatarCol = headers.indexOf("avatar");
    const createdAtCol = headers.indexOf("created_at");
    const isActiveCol = headers.indexOf("is_active");

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[usernameCol] === credentials.username) {
        // Check if user is active
        if (row[isActiveCol] === false || row[isActiveCol] === "FALSE") {
          return createUserJsonResponse({
            success: false,
            message: "Akun Anda tidak aktif. Hubungi admin.",
          });
        }

        // Verify password (simple comparison, consider hashing in production)
        if (row[passwordCol] === credentials.password) {
          // Update last login time
          const lastLoginCol = headers.indexOf("last_login");
          if (lastLoginCol >= 0) {
            usersSheet.getRange(i + 1, lastLoginCol + 1).setValue(new Date());
          }

          return createUserJsonResponse({
            success: true,
            message: "Login berhasil",
            user: {
              id: String(row[idCol]),
              username: row[usernameCol],
              name: row[nameCol],
              role: row[roleCol],
              email: row[emailCol] || "",
              phone: row[phoneCol] || "",
              avatar: row[avatarCol] || "",
              createdAt: row[createdAtCol]
                ? new Date(row[createdAtCol]).toISOString()
                : new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              isActive: true,
            },
          });
        } else {
          return createUserJsonResponse({
            success: false,
            message: "Password salah",
          });
        }
      }
    }

    return createUserJsonResponse({
      success: false,
      message: "Username tidak ditemukan",
    });
  } catch (error) {
    return createUserJsonResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Create Users sheet with default admin account
 */
function createUsersSheet(ss) {
  const sheet = ss.insertSheet(USERS_SHEET_NAME);

  // Add headers
  sheet.appendRow([
    "id",
    "username",
    "password",
    "name",
    "role",
    "email",
    "phone",
    "avatar",
    "created_at",
    "last_login",
    "is_active",
  ]);

  // Add default admin user
  sheet.appendRow([
    "USR-001",
    "admin",
    "admin123", // Change this in production!
    "Administrator",
    "ADMIN",
    "",
    "",
    "",
    new Date(),
    "",
    true,
  ]);

  // Add default kasir user
  sheet.appendRow([
    "USR-002",
    "kasir",
    "kasir123", // Change this in production!
    "Kasir Utama",
    "KASIR",
    "",
    "",
    "",
    new Date(),
    "",
    true,
  ]);

  return sheet;
}

/**
 * Get all users (admin only)
 */
function getUsers() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);

    if (!usersSheet || usersSheet.getLastRow() < 2) {
      return createUserJsonResponse({ users: [] });
    }

    const rows = usersSheet.getDataRange().getValues();
    const users = rows.slice(1).map((row) => ({
      id: String(row[0]),
      username: row[1],
      // Don't include password!
      name: row[3],
      role: row[4],
      email: row[5] || "",
      phone: row[6] || "",
      avatar: row[7] || "",
      createdAt: row[8] ? new Date(row[8]).toISOString() : "",
      lastLogin: row[9] ? new Date(row[9]).toISOString() : "",
      isActive: row[10] === true || row[10] === "TRUE",
    }));

    return createUserJsonResponse({ users });
  } catch (error) {
    return createUserJsonResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Add new user (admin only)
 */
function addUser(userData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let usersSheet = ss.getSheetByName(USERS_SHEET_NAME);

    if (!usersSheet) {
      usersSheet = createUsersSheet(ss);
    }

    // Check if username already exists
    const rows = usersSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === userData.username) {
        return createUserJsonResponse({
          success: false,
          message: "Username sudah digunakan",
        });
      }
    }

    // Generate new user ID
    const newId = "USR-" + String(Date.now()).slice(-6);

    usersSheet.appendRow([
      newId,
      userData.username,
      userData.password,
      userData.name,
      userData.role || "KASIR",
      userData.email || "",
      userData.phone || "",
      userData.avatar || "",
      new Date(),
      "",
      true,
    ]);

    return createUserJsonResponse({
      success: true,
      message: "User berhasil ditambahkan",
      userId: newId,
    });
  } catch (error) {
    return createUserJsonResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Update user data
 */
function updateUser(userData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);

    if (!usersSheet || usersSheet.getLastRow() < 2) {
      return createUserJsonResponse({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const rows = usersSheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === userData.id) {
        // Update fields (don't update username)
        if (userData.password)
          usersSheet.getRange(i + 1, 3).setValue(userData.password);
        if (userData.name)
          usersSheet.getRange(i + 1, 4).setValue(userData.name);
        if (userData.role)
          usersSheet.getRange(i + 1, 5).setValue(userData.role);
        if (userData.email !== undefined)
          usersSheet.getRange(i + 1, 6).setValue(userData.email);
        if (userData.phone !== undefined)
          usersSheet.getRange(i + 1, 7).setValue(userData.phone);
        if (userData.avatar !== undefined)
          usersSheet.getRange(i + 1, 8).setValue(userData.avatar);
        if (userData.isActive !== undefined)
          usersSheet.getRange(i + 1, 11).setValue(userData.isActive);

        return createUserJsonResponse({
          success: true,
          message: "User berhasil diupdate",
        });
      }
    }

    return createUserJsonResponse({
      success: false,
      message: "User tidak ditemukan",
    });
  } catch (error) {
    return createUserJsonResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Delete user (admin only)
 */
function deleteUser(userId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);

    if (!usersSheet || usersSheet.getLastRow() < 2) {
      return createUserJsonResponse({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const rows = usersSheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === userId) {
        // Don't allow deleting the last admin
        if (rows[i][4] === "ADMIN") {
          const adminCount = rows.filter(
            (r) => r[4] === "ADMIN" && r[10] === true
          ).length;
          if (adminCount <= 1) {
            return createUserJsonResponse({
              success: false,
              message: "Tidak bisa menghapus admin terakhir",
            });
          }
        }

        usersSheet.deleteRow(i + 1);
        return createUserJsonResponse({
          success: true,
          message: "User berhasil dihapus",
        });
      }
    }

    return createUserJsonResponse({
      success: false,
      message: "User tidak ditemukan",
    });
  } catch (error) {
    return createUserJsonResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Change password
 */
function changePassword(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);

    if (!usersSheet || usersSheet.getLastRow() < 2) {
      return createUserJsonResponse({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const rows = usersSheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.userId) {
        // Verify old password
        if (rows[i][2] !== data.oldPassword) {
          return createUserJsonResponse({
            success: false,
            message: "Password lama salah",
          });
        }

        // Update password
        usersSheet.getRange(i + 1, 3).setValue(data.newPassword);

        return createUserJsonResponse({
          success: true,
          message: "Password berhasil diubah",
        });
      }
    }

    return createUserJsonResponse({
      success: false,
      message: "User tidak ditemukan",
    });
  } catch (error) {
    return createUserJsonResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Helper function to create JSON response
 */
function createUserJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
