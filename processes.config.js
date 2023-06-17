"use strict";

const path = require("path");
const defaultLogFile = path.join(__dirname, "/logs/project-server.log");

module.exports = {
	apps: [
		{
			name: "graphit-app",
			script: `out/api/dist/index.js`,
			cwd: process.env.WORKDIR,
			node_args: process.env.NODE_ARGS || "--max_old_space_size=1800",
			instances: null,
			autorestart: true,
			max_memory_restart: process.env.MAX_MEMORY_RESTART || "750M",
			out_file: defaultLogFile,
			error_file: defaultLogFile,
			merge_logs: true,
			kill_timeout: 30000,
		},
	],
};
