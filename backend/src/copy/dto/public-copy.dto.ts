export class PublicCopyDto {
  id: number;

  edition: string;

  includesBluRay: boolean;

  condition: string;

  canSell: boolean;
  sellPrice: number | null;

  canRent: boolean;

  boxSet?: {
    id: number;
    title: string | null;
    name: string | null;
    listingNote: string | null;
    canSell: boolean;
    sellPrice: number | null;
    canRent: boolean;
    _count?: {
      copies: number;
    };
  } | null;

  owner: {
    username: string;
    city: string | null;
  };
}