import Link from "next/link";
import { Globe, GitBranch, MessageCircle } from "lucide-react";

export function Footer() {
	const currentYear = new Date().getFullYear();

	const footerLinks = {
		产品: [
			{ label: "功能特性", href: "#features" },
			{ label: "定价方案", href: "#pricing" },
			{ label: "更新日志", href: "#changelog" },
			{ label: "API文档", href: "#api" },
		],
		公司: [
			{ label: "关于我们", href: "#about" },
			{ label: "加入我们", href: "#careers" },
			{ label: "联系我们", href: "#contact" },
			{ label: "合作伙伴", href: "#partners" },
		],
		资源: [
			{ label: "帮助中心", href: "#help" },
			{ label: "开发者文档", href: "#docs" },
			{ label: "社区论坛", href: "#community" },
			{ label: "博客", href: "/blog" },
		],
		法律: [
			{ label: "隐私政策", href: "#privacy" },
			{ label: "服务条款", href: "#terms" },
			{ label: "Cookie政策", href: "#cookies" },
		],
	};

	return (
		<footer className="bg-gray-900 text-gray-300">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="py-12 grid grid-cols-2 md:grid-cols-6 gap-8">
					<div className="col-span-2">
						<Link href="/" className="flex items-center gap-2 mb-4">
							<Globe className="h-8 w-8 text-blue-400" />
							<span className="text-xl font-bold text-white">OpenNext Starter</span>
						</Link>
						<p className="text-sm text-gray-400 mb-6 max-w-xs">
							基于 Next.js 和 Cloudflare Workers 构建的现代化 Web 应用模板，助力快速开发和部署。
						</p>
						<div className="flex gap-4">
							<a
								href="https://github.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-400 hover:text-white transition-colors"
							>
								<GitBranch className="h-6 w-6" />
							</a>
							<a
								href="https://twitter.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-400 hover:text-white transition-colors"
							>
								<MessageCircle className="h-6 w-6" />
							</a>
						</div>
					</div>

					{Object.entries(footerLinks).map(([title, links]) => (
						<div key={title}>
							<h3 className="text-white font-semibold mb-4">{title}</h3>
							<ul className="space-y-2">
								{links.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											className="text-sm text-gray-400 hover:text-white transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="py-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-sm text-gray-400">
						© {currentYear} OpenNext Starter. 保留所有权利。
					</p>
					<p className="text-sm text-gray-400">
						使用 Next.js + Cloudflare Workers 构建
					</p>
				</div>
			</div>
		</footer>
	);
}