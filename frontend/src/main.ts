import './style.css';
import 'htmx.org';

// TODO: SEPARATE TO ANOTHER FILE
const themeToggle = document.getElementById('theme-toggle') as HTMLInputElement | null;
const html = document.documentElement;

const checkTheme = (): void => {
	if (!themeToggle) {
		return;
	}

	const savedTheme = localStorage.getItem('hori-theme');

	if (savedTheme) {
		html.setAttribute('data-theme', savedTheme);
		themeToggle.checked = savedTheme === 'dark';
		return;
	}

	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
	themeToggle.checked = prefersDark;
};

if (themeToggle) {
	themeToggle.addEventListener('change', async (e) => {
		const target = e.target as HTMLInputElement;
		const newTheme = target.checked ? 'dark' : 'light';
		await switchTheme(newTheme, false);
	});
}


const switchTheme = async (newTheme: string, updateToggle: boolean = false): Promise<void> => {
	const applyTheme = () => {
		html.setAttribute('data-theme', newTheme);
		localStorage.setItem('hori-theme', newTheme);

		if (updateToggle && themeToggle) {
			themeToggle.checked = newTheme === 'dark';
		}
	};

	if (!document.startViewTransition) {
		applyTheme();
		return;
	}

	const transition = document.startViewTransition(applyTheme);

	await transition.finished;
};

document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
        document.body.classList.add('ready');
    });
});

function main() {
	checkTheme();
	///
}

main();