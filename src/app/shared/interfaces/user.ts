export interface User {
    // id будет соответствовать Firebase Auth UID пользователя
    id: string; // Теперь это обязательное строковое поле, равное Firebase Auth UID
    username: string; // Храним имя пользователя в Firestore
    // Пароль НЕ ХРАНИМ в Firestore, его обрабатывает Firebase Auth
    description?: string;
    avatarUrl?: string;
    // ... другие поля профиля, которые ты хочешь хранить
}


export interface SavedRouteInDb {
    id?: string; // Firestore document ID
    userId: string; // Firebase Auth UID пользователя-владельца
    createdAt: Date; // Timestamp создания (будет преобразован в Date при чтении @angular/fire)

    startAddress: string;
    endAddress: string;
    mode: string;

    // Поля для хранения сериализованных данных OSRM как JSON строки
    routesJson: string | null;
    waypointsJson: string | null;

    // Опционально: простые поля из OSRM, сохраненные отдельно
    duration?: number; // Например, общая длительность в секундах
    distance?: number; // Например, общее расстояние в метрах
}

// ИНТЕРФЕЙС ДЛЯ ДАННЫХ, КАК ОНИ ИСПОЛЬЗУЮТСЯ В ПРИЛОЖЕНИИ ПОСЛЕ ЗАГРУЗКИ И ПАРСИНГА
// Включает распарсенные объекты/массивы
export interface LoadedRoute {
    id?: string; // Firestore document ID (тот же, что и в базе)
    userId: string; // Firebase Auth UID
    createdAt: Date; // Дата объект

    startAddress: string;
    endAddress: string;
    mode: string;

    // Распарсенные объекты/массивы, используемые компонентами (например, MapComponent)
    routes: any[] | null; // Содержимое routesJson после JSON.parse
    waypoints: any[] | null; // Содержимое waypointsJson после JSON.parse

    // Опционально: простые поля
    duration?: number;
    distance?: number;

    // Включаем все поля из SavedRouteInDb, которые нужны после загрузки
    // кроме самих JSON строк, если они не используются после парсинга.
}