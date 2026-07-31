export class PublicCopyDto {
  id: number;

  edition: string;

  includesBluRay: boolean;

  condition: string;

  canSell: boolean;
  sellPrice: number | null;

  canRent: boolean;
  rentPrice: number | null;
  deposit: number | null;

  owner: {
    username: string;
    city: string | null;
  };
}