// Type declarations for importing CSS/SCSS files in TypeScript
declare module "*.css" {
	const content: string;
	export default content;
}

declare module "*.scss" {
	const content: string;
	export default content;
}

declare module "*.module.css" {
	const classes: Record<string, string>;
	export default classes;
}

declare module "*.module.scss" {
	const classes: Record<string, string>;
	export default classes;
}
