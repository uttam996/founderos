export interface EmbeddingsProvider {
  readonly name: string;
  readonly dim: number;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
