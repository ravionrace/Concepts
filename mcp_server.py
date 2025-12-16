"""
MCP Server with HTTP Transport for VSCode
This server provides various tools that can be used by AI assistants in VSCode
"""

from mcp.server.fastmcp import FastMCP, Context
import asyncio
from datetime import datetime
import json
import os

# Initialize FastMCP server with HTTP transport
mcp = FastMCP(
    "VSCode MCP Server",
    json_response=True
)

# Configure for streamable HTTP (default port is 8000)
# You can change the port by setting: mcp.settings.port = 3000


@mcp.tool()
def get_current_datetime() -> str:
    """Get the current date and time"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


@mcp.tool()
def calculate(expression: str) -> str:
    """
    Safely evaluate a mathematical expression
    Args:
        expression: A mathematical expression (e.g., "2 + 2", "10 * 5")
    """
    try:
        # Only allow basic math operations for security
        allowed_chars = set("0123456789+-*/().% ")
        if not all(c in allowed_chars for c in expression):
            return "Error: Only basic math operations are allowed"
        
        result = eval(expression)
        return f"{expression} = {result}"
    except Exception as e:
        return f"Error calculating expression: {str(e)}"


@mcp.tool()
def format_json(json_string: str) -> str:
    """
    Format a JSON string with proper indentation
    Args:
        json_string: A JSON string to format
    """
    try:
        parsed = json.loads(json_string)
        formatted = json.dumps(parsed, indent=2, sort_keys=True)
        return formatted
    except json.JSONDecodeError as e:
        return f"Error: Invalid JSON - {str(e)}"


@mcp.tool()
async def read_file(file_path: str, ctx: Context) -> str:
    """
    Read contents of a file
    Args:
        file_path: Absolute path to the file to read
    """
    try:
        await ctx.info(f"Reading file: {file_path}")
        
        if not os.path.exists(file_path):
            return f"Error: File not found - {file_path}"
        
        if not os.path.isfile(file_path):
            return f"Error: Path is not a file - {file_path}"
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return content
    except Exception as e:
        return f"Error reading file: {str(e)}"


@mcp.tool()
async def list_directory(directory_path: str, ctx: Context) -> str:
    """
    List contents of a directory
    Args:
        directory_path: Absolute path to the directory
    """
    try:
        await ctx.info(f"Listing directory: {directory_path}")
        
        if not os.path.exists(directory_path):
            return f"Error: Directory not found - {directory_path}"
        
        if not os.path.isdir(directory_path):
            return f"Error: Path is not a directory - {directory_path}"
        
        items = os.listdir(directory_path)
        
        files = []
        directories = []
        
        for item in items:
            full_path = os.path.join(directory_path, item)
            if os.path.isfile(full_path):
                size = os.path.getsize(full_path)
                files.append(f"  📄 {item} ({size} bytes)")
            else:
                directories.append(f"  📁 {item}/")
        
        result = f"Contents of {directory_path}:\n\n"
        if directories:
            result += "Directories:\n" + "\n".join(sorted(directories)) + "\n\n"
        if files:
            result += "Files:\n" + "\n".join(sorted(files))
        
        return result if (files or directories) else "Directory is empty"
        
    except Exception as e:
        return f"Error listing directory: {str(e)}"


@mcp.tool()
def text_stats(text: str) -> str:
    """
    Get statistics about a text string
    Args:
        text: The text to analyze
    """
    words = text.split()
    lines = text.split('\n')
    
    stats = {
        "characters": len(text),
        "characters_no_spaces": len(text.replace(" ", "")),
        "words": len(words),
        "lines": len(lines),
        "paragraphs": len([p for p in text.split('\n\n') if p.strip()])
    }
    
    return json.dumps(stats, indent=2)


@mcp.resource("config://server-info")
def get_server_info() -> str:
    """Provide server configuration and information"""
    info = {
        "name": "VSCode MCP Server",
        "version": "1.0.0",
        "transport": "streamable-http",
        "port": 8000,
        "available_tools": [
            "get_current_datetime",
            "calculate",
            "format_json",
            "read_file",
            "list_directory",
            "text_stats"
        ],
        "description": "A general-purpose MCP server for VSCode with file operations and utilities"
    }
    return json.dumps(info, indent=2)


if __name__ == "__main__":
    # Run with SSE transport for VSCode compatibility
    # The server will be available at http://localhost:8000/sse
    print("Starting MCP Server with SSE transport...")
    print("Server will be available at: http://localhost:8000/sse")
    print("Connect VSCode to: http://localhost:8000/sse")
    print("Press Ctrl+C to stop the server")
    print()
    
    mcp.run(transport="sse")
