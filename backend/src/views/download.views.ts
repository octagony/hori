import { IDownloadPreviewData } from "@/types/IDownload.interface";
import { esc, formatDuration } from "@/utils/helpers";

export const previewCard = (v: IDownloadPreviewData): string => {
	const watchUrl = `https://www.youtube.com/watch?v=${esc(v.id)}`;

	const thumb = v.thumbnail ? esc(v.thumbnail) : '';

	return (`
		<div 
			class="relative rounded-2xl overflow-hidden shadow-lg bg-neutral animate-slide-up mb-4">
    ${thumb
			? `<img 
						src="${thumb}" 
						alt="yt-video-preview" 
						class="w-full 
						aspect-video 
						object-cover" 
						loading="lazy">`
			: `<div 
						class="w-full 
						aspect-video 
						bg-base-300"
					></div>`}
    <div 
			class="absolute inset-0 bg-linear-to-b from-black/70 via-transparent to-black/50 pointer-events-none">
			</div>

    <a 
			href="${watchUrl}" 
			target="_blank" 
			rel="noopener noreferrer"
      class="absolute inset-0 grid place-content-center group" aria-label="Open on Youtube">
        <span 
					class="grid place-content-center w-16 h-11 rounded-xl bg-error text-white shadow-xl transition group-hover:scale-110">
            <svg 
							viewBox="0 0 24 24" 
							fill="currentColor" 
							style="width:26px;height:26px">
                <path d="M8 5v14l11-7z"/>
            </svg>
        </span>
    </a>

    <div class="absolute top-0 inset-x-0 p-4 flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <span class="grid place-content-center size-9 rounded-full bg-error text-white shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </span>
				<div class="min-w-0">
						<p class="text-white font-medium truncate">${esc(v.title)}</p>
						<p class="text-white/60 text-xs truncate">${esc(v.uploader)}</p>
				</div>
			</div>
    </div>
    <span class="absolute bottom-3 right-3 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium tabular-nums">
        ${formatDuration(v.duration)}
    </span>
	</div>`);
};

const poller = (jobId: string): string => {
	return (`<div 
			hx-get="/api/download/${esc(jobId)}" hx-trigger="every 2s"
	    hx-target="#status" 
			hx-swap="innerHTML">
	</div>`);
};

export const progressBlock = (jobId: string, progress: number, queued: boolean): string => {
	return (`<div class="rounded-xl border border-base-300 bg-base-200 p-4 animate-fade-in">
    <div class="flex justify-between items-center text-sm mb-2">
        <span class="font-medium">
					${queued ? 'In queue...' : 'Download...'}
				</span>
        <span class="text-base-content/60 tabular-nums">
					${Math.round(progress)}%
				</span>
    </div>
    <progress 
			class="progress progress-primary w-full" 
			value="${Math.round(progress)}" 
			max="100">
		</progress>
</div>
${poller(jobId)}`);
};

export const completedBlock = (jobId: string, filename: string): string => {
	return (`<div class="rounded-xl border border-success/40 bg-success/10 p-5 text-center animate-slide-up">
    <p class="font-semibold text-success mb-1">Your file:</p>
    <p class="text-sm text-base-content/60 mb-4 truncate">
			${esc(filename)}
		</p>
    <a 
			href="/api/download/${esc(jobId)}/file" 
			download 
			class="btn btn-success gap-2">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Save file
    </a>
</div>`);
};

export const errorBlock = (message: string): string => {
	return (`<div class="alert alert-error animate-fade-in">
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16a2 2 0 001.73 3z"/>
    </svg>
    <span class="text-sm break-all">${esc(message)}</span>
</div>`);
};