import axios from "axios"

export class Gist {
  constructor(private token: string) {}

  async pull(id: string, fileName: string): Promise<string> {
    const { data } = await axios.get("https://api.github.com/gists/" + id, {
      headers: { Authorization: `token ${this.token}` }
    })

    return data.files[fileName].content
  }

  async push(id: string, fileName: string, content: string) {
    await axios.patch(
      "https://api.github.com/gists/" + id,
      { files: { [fileName]: { content } } },
      { headers: { Authorization: `token ${this.token}` } }
    )
  }
}
