# Source Code

This directory contains the TypeScript source code for the Xano MCP server.

## Overview

The Xano MCP (Model Context Protocol) server provides a standardized interface for AI assistants to interact with Xano databases and APIs. It implements tools that handle operations on:

- Database tables
- API groups 
- API endpoints

## Structure

- **index.ts** - Main entry point for the MCP server
- **tools/** - Tool implementations organized by category
  - **api.ts** - Common API utilities for making requests to Xano
  - **types.ts** - TypeScript type definitions
  - **utils.ts** - Utility functions shared across tools

## Environment Variables

The server requires the following environment variables:

- `XANO_API_KEY` - API key for Xano
- `XANO_WORKSPACE` - Workspace ID for Xano
- `XANO_API_BASE` - Base URL for Xano API

## Documentation

For more information on how to use these tools, refer to the parent README.md file.