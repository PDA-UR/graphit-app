import "./toast.css";

export enum ToastType {
	SUCCESS,
	ERROR,
	WARNING,
	INFO,
}

export enum ToastLength {
	SHORT = 1000,
	MEDIUM = 2000,
	LONG = 5000,
}

export class Toast {
	constructor(
		public message: string,
		public type: ToastType,
		public length: ToastLength
	) {}

	public static success(
		message: string,
		length: ToastLength = ToastLength.MEDIUM
	): Toast {
		return new Toast(message, ToastType.SUCCESS, length);
	}

	public static error(
		message: string,
		length: ToastLength = ToastLength.MEDIUM
	): Toast {
		return new Toast(message, ToastType.ERROR, length);
	}

	public static warning(
		message: string,
		length: ToastLength = ToastLength.MEDIUM
	): Toast {
		return new Toast(message, ToastType.WARNING, length);
	}

	public static info(
		message: string,
		length: ToastLength = ToastLength.MEDIUM
	): Toast {
		return new Toast(message, ToastType.INFO, length);
	}

	public static fromError(
		error: Error,
		length: ToastLength = ToastLength.MEDIUM
	): Toast {
		return new Toast(error.message, ToastType.ERROR, length);
	}

	public show() {
		const $container = document.createElement("div"),
			$icon = $container.appendChild(document.createElement("div")),
			$message = $container.appendChild(document.createElement("div"));

		$container.classList.add("toast");
		$container.classList.add("base-container");
		$container.classList.add(ToastType[this.type].toLowerCase());

		$message.innerHTML = this.message;
		$icon.classList.add("toast-icon");

		document.body.appendChild($container);
		$container.classList.add("toast-show");

		setTimeout(() => {
			$container.classList.remove("toast-show");
			$container.classList.add("toast-hide");
			setTimeout(() => {
				$container.remove();
			}, 300);
		}, this.length);
	}
}
