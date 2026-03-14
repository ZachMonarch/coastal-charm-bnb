import { SEOHead } from './SEOHead';

interface PropertySEOHeadProps {
  property: {
    id: number;
    title: string;
    description: string;
    address: string;
    city: string;
    state: string;
    zip_code: number;
    price: number;
    bedrooms: number;
    bathrooms: number;
    square_feet: string;
    property_type: string;
    image_urls: string;
    amenities: string;
  };
}

export function PropertySEOHead({ property }: PropertySEOHeadProps) {
  // Parse image URLs
  const images = property.image_urls
    ? JSON.parse(property.image_urls)
    : [];
  const primaryImage = images[0] || '/placeholder.svg';

  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(property.price);

  // Create rich description
  const description = `${property.bedrooms} bed, ${property.bathrooms} bath ${
    property.property_type
  } for rent at ${formattedPrice}/month. Located in ${property.city}, ${
    property.state
  }. ${property.square_feet} sq ft. ${property.description.slice(0, 100)}...`;

  // Parse amenities
  const amenities = property.amenities
    ? JSON.parse(property.amenities)
    : [];

  // Generate keywords
  const keywords = [
    `${property.bedrooms} bedroom`,
    `${property.bathrooms} bathroom`,
    property.property_type,
    property.city,
    property.state,
    `${property.zip_code}`,
    'for rent',
    'property rental',
    ...amenities.slice(0, 5),
  ];

  // Canonical URL
  const canonicalUrl = `https://monarchpropertymmgt.online/properties/${property.id}`;

  return (
    <SEOHead
      title={`${property.title} - ${property.city}, ${property.state}`}
      description={description}
      keywords={keywords}
      image={primaryImage}
      url={canonicalUrl}
      type="product"
      price={{
        amount: property.price,
        currency: 'USD',
      }}
      availability="InStock"
    />
  );
}
