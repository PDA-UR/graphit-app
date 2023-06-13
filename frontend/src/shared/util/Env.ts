export const getEnvVar = (name: string) => {
	return import.meta.env[name];
};
