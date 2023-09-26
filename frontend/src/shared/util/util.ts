export const isDesktop = () => {
	const userAgent = navigator.userAgent;
	const isMac = /Mac/.test(userAgent);
	const isWindows = /Windows/.test(userAgent);
	const isLinux = /Linux/.test(userAgent);
	return isMac || isWindows || isLinux;
};

export const isUsingMouse = () => {
	const userAgent = navigator.userAgent;
	const isTouch = /Touch/.test(userAgent);
	return !isTouch;
};
