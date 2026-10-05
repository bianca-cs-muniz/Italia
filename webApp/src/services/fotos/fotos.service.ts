import HttpClient from "../HttpClient";

// Endereço para usar direto em <img src>: passa pelo rewrite do Next até a API.
export const urlDaFoto = (id: string) => `/api/fotos/${encodeURIComponent(id)}`;

class FotosService {
  private httpClient = new HttpClient();
  private path = "/fotos";

  // Envia os bytes da imagem (JPEG, PNG ou WebP, até 2 MB) e devolve o id da foto.
  async enviar(imagem: Blob): Promise<string> {
    const res = await this.httpClient.postBinario<{ id: string }>(this.path, imagem, imagem.type || "image/jpeg");
    return res.id;
  }
}

const fotosService = new FotosService();
export default fotosService;
