/**
 * Паттерн Singleton для получения фиксированного текущего пользователя (создателя).
 * В лабораторной работе №3 авторизация еще не используется, поэтому
 * пользователь-создатель зафиксирован константой через функцию-singleton.
 */
export class CurrentUserSingleton {
  private static instance: CurrentUserSingleton;

  // Константа ID текущего пользователя-создателя
  private readonly CURRENT_USER_ID = 1;
  private readonly CURRENT_USERNAME = 'pg_expert';

  private constructor() {}

  public static getInstance(): CurrentUserSingleton {
    if (!CurrentUserSingleton.instance) {
      CurrentUserSingleton.instance = new CurrentUserSingleton();
    }
    return CurrentUserSingleton.instance;
  }

  public getUserId(): number {
    return this.CURRENT_USER_ID;
  }

  public getUsername(): string {
    return this.CURRENT_USERNAME;
  }
}

/**
 * Функция-singleton, возвращающая ID фиксированного пользователя-создателя (константа = 1)
 */
export function getCurrentUserId(): number {
  return CurrentUserSingleton.getInstance().getUserId();
}
