import fs from "fs";

export function readWallets(filePath) {
	try {
		const fileContent = fs.readFileSync(filePath, "utf-8");
		const lines = fileContent
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line !== "");
		return lines;
	} catch (error) {
		console.error("Error reading the file:", error.message);
		return [];
	}
}

export function readProxy(filePath) {
	try {
		const proxyList = readWallets("./data/proxy.txt");
		const proxies = proxyList
			.map((proxyString) => {
				// Убираем лишние пробелы в начале и конце строки
				proxyString = proxyString.trim();

				// Если строка пустая, пропускаем
				if (!proxyString) return null;

				// Регулярное выражение для парсинга
				const regex = /^(.*):(\d+)@([^:]+):(.+)$/;

				// Применяем регулярное выражение
				const match = proxyString.match(regex);

				if (match) {
					// Извлекаем значения
					const proxyServer = `${match[1]}:${match[2]}`;
					const proxyUsername = match[3];
					const proxyPassword = match[4];

					// Возвращаем объект с данными
					return { proxyServer, proxyUsername, proxyPassword };
				} else {
					console.log(`Неверный формат строки: ${proxyString}`);
					return null;
				}
			})
			.filter((item) => item !== null);
		return proxies;
	} catch (error) {
		console.error("Error reading the file:", error.message);
		return [];
	}
}
