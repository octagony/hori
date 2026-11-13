export interface IVideoInfo {
	id: string,
	title: string,
	duration: number,
	thumbnail: string | null,
	uploader: string,
	channel?: string,
	url: string,
	formats: IVideoFormat[],
}

export interface IVideoFormat {
	format_id: string,
	ext: string,
	resolution: string | null,
	filesize: number | null,
	vcodec: string | null,
	acodec: string | null,
}

export interface IVideoMeta {
	id: string;
	title: string;
	duration: number;
	thumbnail: string | null;
	uploader: string;
	url: string;
}

export interface IVideoExecute {
	stdout: string; 
	stderr: string;
	code: number | null;
}