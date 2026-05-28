"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
	isOpen: boolean;
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	confirmVariant?: "danger" | "primary";
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	isOpen,
	title = "确认",
	message,
	confirmText = "确认",
	cancelText = "取消",
	confirmVariant = "primary",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsVisible(true);
		} else {
			setIsVisible(false);
		}
	}, [isOpen]);

	if (!isVisible) return null;

	const handleConfirm = () => {
		setIsVisible(false);
		onConfirm();
	};

	const handleCancel = () => {
		setIsVisible(false);
		onCancel();
	};

	return (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-screen">
				<div
					className="absolute inset-0 bg-black/30 backdrop-blur-sm"
					onClick={handleCancel}
				/>
				<div
					className="relative bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden my-auto"
					style={{
						animation: "scaleIn 0.2s ease-out",
					}}
				>
				<button
					onClick={handleCancel}
					className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
				>
					<X className="h-5 w-5 text-gray-400" />
				</button>

				<div className="p-6">
					<div className="flex items-start gap-4">
						{confirmVariant === "danger" && (
							<div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
								<AlertTriangle className="h-5 w-5 text-red-600" />
							</div>
						)}
						<div className="flex-1">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								{title}
							</h3>
							<p className="text-gray-600 text-sm">
								{message}
							</p>
						</div>
					</div>
				</div>

				<div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
					<button
						onClick={handleCancel}
						className="flex-1 px-4 py-2 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
					>
						{cancelText}
					</button>
					<button
						onClick={handleConfirm}
						className={`flex-1 px-4 py-2 text-white font-medium rounded-lg transition-colors ${
							confirmVariant === "danger"
								? "bg-red-600 hover:bg-red-700"
								: "bg-blue-600 hover:bg-blue-700"
						}`}
					>
						{confirmText}
					</button>
				</div>
			</div>
			<style>{`
				@keyframes scaleIn {
					from {
						opacity: 0;
						transform: scale(0.95);
					}
					to {
						opacity: 1;
						transform: scale(1);
					}
				}
			`}</style>
		</div>
	);
}
