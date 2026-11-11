import './style.css';
import 'htmx.org';

const themeToggle = document.getElementById('theme-toggle') as HTMLInputElement | null;
const html = document.documentElement;

const checkTheme = () => {
	if (!themeToggle) {
		return;
	}

	const savedTheme = localStorage.getItem('hori-theme');

	if (savedTheme) {
		html.setAttribute('data-theme', savedTheme);
		themeToggle.checked = savedTheme === 'dark';
		return;
	}

	if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
		html.setAttribute('data-theme', 'dark');
		themeToggle.checked = true;
	}

	if (!window.matchMedia('(prefers-color-scheme: dark)').matches) {
		html.setAttribute('data-theme', 'light');
		themeToggle.checked = false;
	}
};

if (themeToggle) {
	themeToggle.addEventListener('change', (e) => {
		const target = e.target as HTMLInputElement;

		const newTheme = target.checked ? 'dark' : 'light';

		html.setAttribute('data-theme', newTheme);
		localStorage.setItem('hori-theme', newTheme);
	});
}


function main() {
	checkTheme();
	///
}

main();