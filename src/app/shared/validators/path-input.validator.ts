export function isValidMalwareProtectionExclusionPath(path: string): boolean {
    // 1. Check if the path contains an environment variable pattern (e.g., %HOMEDRIVE%).
    const envVarPattern = /%[^%]+%/;
    if (envVarPattern.test(path)) {
        return false;
    }

    // 2. If the path ends with a backslash (\), it's interpreted as a folder.
    if (path.endsWith("\\")) {
        // Valid folder path
        return true;
    }

    // 3. If the path does not contain any path separator (\), it's interpreted as a name.
    if (!path.includes("\\")) {
        // Valid file name or process name
        return true;
    }

    // 4. All other entries are interpreted as a full path.
    // Check for invalid characters. Allow alphanumeric, :, \, *, ?, _, ., -, (, ), spaces and @
    if (/[^a-zA-Z0-9:\\*?. _()-@]/.test(path)) {
        return false;
    }

    // All checks passed, the path is valid.
    return true;
}

export function isValidRTIDExclusionPath(path: string): boolean {
    // 1. Check if the path contains an environment variable pattern (e.g., %HOMEDRIVE%).
    const envVarPattern = /%[^%]+%/;
    if (envVarPattern.test(path)) {
        return false;
    }

    // 2. Wildcards (* or ?) are not supported.
    if (path.includes("*") || path.includes("?")) {
        return false;
    }

    // 3. Ensure the path starts with either a drive letter (e.g., C:\) or a UNC path (e.g., \\Server\Share\).
    const driveLetterPattern = /^[a-zA-Z]:\\/;
    const uncPathPattern = /^\\\\[a-zA-Z0-9._-]+\\[a-zA-Z0-9._-]+/;

    if (!driveLetterPattern.test(path) && !uncPathPattern.test(path)) {
        return false;
    }

    // 4. Check for invalid characters. Allow alphanumeric, :, \, _, ., -, (, ), spaces, and @
    if (/[^a-zA-Z0-9:\\_(). -@]/.test(path)) {
        return false;
    }

    // All checks passed, the path is valid.
    return true;
}

export function isValidExploitGuardExclusionPath(path: string): boolean {
    // 1. Check if the path contains an environment variable pattern (e.g., %HOMEDRIVE%).
    const envVarPattern = /%[^%]+%/;
    if (envVarPattern.test(path)) {
        return false;
    }

    // 2. Check if the path contains wildcards (* or ?).
    if (path.includes("*") || path.includes("?")) {
        return false;
    }

    // 3. If the path ends with a backslash (\), it's interpreted as a folder.
    if (path.endsWith("\\")) {
        // Valid folder path
        return true;
    }

    // 4. If the path does not contain any path separator (\), it's interpreted as a name.
    if (!path.includes("\\")) {
        // Valid file name
        return true;
    }

    // 5. All other cases are interpreted as a full path.
    // Check for invalid characters. Allow alphanumeric, :, \, _, ., -, (, ), spaces and @
    if (/[^a-zA-Z0-9:\\_(). -@]/.test(path)) {
        return false;
    }

    // All checks passed.
    return true;
}

export function isValidExploitGuardMonitoredApplication(
    application: string
): boolean {
    // Check if the application string contains any path separators (Windows: '\', Unix: '/')
    if (application.includes("\\") || application.includes("/")) {
        return false;
    }

    // Check if the string contains only a file name and extension (e.g., notepad.exe)
    const fileNamePattern = /^[^\\/]+(\.[a-zA-Z0-9]+)?$/; // Matches binary name (with or without extension)
    return fileNamePattern.test(application);
}

export function isValidProcessExclusionPath(processPath: string): boolean {
    // Check if the path contains environment variable pattern.
    const envVarPattern = /%[^%]+%/;
    if (envVarPattern.test(processPath)) {
        return false;
    }

    // If none of the invalid conditions match, it's valid.
    return true;
}

export function isValidMD5Hash(md5Hash: string): boolean {
    // Check if the given string is a valid MD5 hash (32 hex characters)
    const md5HashPattern = /^[a-fA-F0-9]{32}$/;
    return md5HashPattern.test(md5Hash);
}
