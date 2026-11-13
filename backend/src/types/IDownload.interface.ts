export const ESCAPE_MAP: Record<string, string> = {
	'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

export interface IDownloadPreviewData {
	id: string;
	title: string;
	duration: number;
	thumbnail: string | null;
	uploader: string;
	url: string;
}