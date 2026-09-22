import { User } from "@/types";

// Simüle edilmiş mevcut oturum açan kullanıcı (Saha Ekibi Demo)
export const demoFieldUser: User = {
  id: "U-001",
  name: "Demo Saha Çalışanı",
  role: "field",
  teamId: "T3",
  teamName: "Ekip 03"
};

// Simüle edilmiş mevcut oturum açan kullanıcı (Mühendis Demo)
export const demoEngineerUser: User = {
  id: "U-002",
  name: "Demo Yapım Mühendisi",
  role: "engineer"
};

class AuthService {
  // Demo amaçlı saha kullanıcısını döndürür
  async getCurrentFieldUser(): Promise<User> {
    return Promise.resolve(demoFieldUser);
  }

  // Demo amaçlı mühendis kullanıcısını döndürür
  async getCurrentEngineerUser(): Promise<User> {
    return Promise.resolve(demoEngineerUser);
  }
}

export const authService = new AuthService();
