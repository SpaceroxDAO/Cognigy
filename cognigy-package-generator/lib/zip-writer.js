const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Write package files to a temporary directory and create a ZIP.
 * @param {Object} files - Map of relative path → JSON object
 * @param {string} outputPath - Where to write the ZIP file
 */
function writePackageZip(files, outputPath) {
  // Create temp dir
  const tmpDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "cognigy-pkg-"));

  try {
    // Write all files
    for (const [relativePath, data] of Object.entries(files)) {
      const fullPath = path.join(tmpDir, relativePath);
      const dir = path.dirname(fullPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, JSON.stringify(data));
    }

    // Create ZIP using the system zip command
    const absOutput = path.resolve(outputPath);
    // Remove existing file if present
    if (fs.existsSync(absOutput)) {
      fs.unlinkSync(absOutput);
    }

    execSync(`cd "${tmpDir}" && zip -r "${absOutput}" .`, {
      stdio: "pipe",
    });

    console.log(`Package created: ${absOutput}`);
    console.log(`Files: ${Object.keys(files).length}`);

    return absOutput;
  } finally {
    // Clean up temp dir
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

module.exports = { writePackageZip };
