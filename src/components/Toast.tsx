"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
	message: string;
	type?: ToastType;
	onClose?: () => void;
	duration?: number;
}

export function Toast({ message, type = "info", onClose, duration = 3000 }: ToastProps) {
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				setIsVisible(false);
				onClose?.();
			}, duration);
			return () => clearTimeout(timer);
		}
	}, [duration, onClose]);

	const handleClose = () => {
		setIsVisible(false);
		onClose?.();
	};

	const iconProps = { className: "h-6 w-6" };
	const icons = {
		success: <CheckCircle {...iconProps} className="h-6 w-6 text-green-500" />,
		error: <XCircle {...iconProps} className="h-6 w-6 text-red-500" />,
		warning: <AlertCircle {...iconProps} className="h-6 w-6 text-yellow-500" />,
		info: <Info {...iconProps} className="h-6 w-6 text-blue-500" />,
	};

	const bgColors = {
		success: "bg-green-50 border-green-200",
		error: "bg-red-50 border-red-200",
		warning: "bg-yellow-50 border-yellow-200",
		info: "bg-blue-50 border-blue-200",
	};

	const textColors = {
		success: "text-green-800",
		error: "text-red-800",
		warning: "text-yellow-800",
		info: "text-blue-800",
	};

	return (
		<>
			{isVisible && (
				<div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
					<div 
						className="absolute inset-0 bg-black/30 backdrop-blur-sm"
						onClick={handleClose}
					/>
					<div
						className={`relative flex items-center gap-3 px-6 py-4 rounded-xl border shadow-lg min-w-[280px] max-w-md ${bgColors[type]}`}
						style={{
							animation: "slideUp 0.3s ease-out",
						}}
					>
						{icons[type]}
						<span className={`flex-1 font-medium ${textColors[type]}`}>
							{message}
						</span>
						<button
							onClick={handleClose}
							className="p-1 rounded-full hover:bg-black/10 transition-colors"
						>
							<X className="h-4 w-4 text-gray-500" />
						</button>
					</div>
					<style>{`
						@keyframes slideUp {
							from {
								opacity: 0;
								transform: translateY(20px);
							}
							to {
								opacity: 1;
								transform: translateY(0);
							}
						}
					`}</style>
				</div>
			)}
		</>
	);
}

// Toast 容器组件，用于管理多个弹窗
interface ToastContainerProps {
	toasts: Array<{ id: string; message: string; type: ToastType }>;
	onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					message={toast.message}
					type={toast.type}
					onClose={() => onRemove(toast.id)}
				/>
			))}
		</div>
	);
}