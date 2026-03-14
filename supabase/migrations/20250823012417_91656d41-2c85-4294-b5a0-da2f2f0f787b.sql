-- Create admin user profile with proper role assignment
-- First, create the admin profile if it doesn't exist
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
) VALUES (
    'ad1e1234-5678-90ab-cdef-123456789000'::uuid,
    'admin@monarchpropertymmgt.online',
    'System Administrator',
    'admin',
    'active',
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = now();

-- Insert admin role
INSERT INTO public.user_roles (
    user_id,
    role,
    granted_by,
    granted_at
) VALUES (
    'ad1e1234-5678-90ab-cdef-123456789000'::uuid,
    'admin',
    'ad1e1234-5678-90ab-cdef-123456789000'::uuid,
    now()
) ON CONFLICT (user_id, role) DO NOTHING;

-- Update existing properties with real data
UPDATE public.properties SET
    title = CASE id
        WHEN 1 THEN 'Luxury Downtown Apartment'
        WHEN 2 THEN 'Family Townhouse in Suburb'
        WHEN 3 THEN 'Modern Studio Loft'
        WHEN 4 THEN 'Executive Penthouse Suite'
        WHEN 5 THEN 'Cozy One-Bedroom Condo'
        WHEN 6 THEN 'Spacious Two-Story House'
        WHEN 7 THEN 'Charming Garden Apartment'
        WHEN 8 THEN 'Contemporary High-Rise Unit'
        WHEN 9 THEN 'Historic Brownstone Rental'
        ELSE title
    END,
    description = CASE id
        WHEN 1 THEN 'Stunning luxury apartment in the heart of downtown with floor-to-ceiling windows, modern amenities, and breathtaking city views. Features include stainless steel appliances, hardwood floors, and a private balcony.'
        WHEN 2 THEN 'Beautiful family townhouse in quiet suburban neighborhood. Perfect for families with children, featuring a spacious backyard, modern kitchen, and close proximity to top-rated schools and parks.'
        WHEN 3 THEN 'Stylish studio loft with exposed brick walls, high ceilings, and industrial-chic design. Located in trendy arts district with easy access to galleries, restaurants, and public transportation.'
        WHEN 4 THEN 'Exclusive penthouse suite offering panoramic city views, luxury finishes, and premium amenities. Features include a private rooftop terrace, concierge service, and valet parking.'
        WHEN 5 THEN 'Comfortable one-bedroom condo in well-maintained building with modern amenities. Perfect for young professionals or couples, featuring updated kitchen and bathroom with granite countertops.'
        WHEN 6 THEN 'Spacious two-story house with large living areas, updated kitchen, and beautiful landscaping. Features include a two-car garage, basement storage, and quiet residential location.'
        WHEN 7 THEN 'Charming garden-level apartment with private patio and access to beautiful community gardens. Recently renovated with modern fixtures while maintaining classic architectural details.'
        WHEN 8 THEN 'Contemporary unit in modern high-rise building with state-of-the-art amenities including fitness center, rooftop pool, and 24-hour concierge service. River views from every room.'
        WHEN 9 THEN 'Historic brownstone rental in prestigious neighborhood. Beautifully preserved period features combined with modern conveniences. Walking distance to museums, cafes, and boutique shopping.'
        ELSE description
    END,
    city = CASE id
        WHEN 1 THEN 'New York'
        WHEN 2 THEN 'Westchester'
        WHEN 3 THEN 'Brooklyn'
        WHEN 4 THEN 'Manhattan'
        WHEN 5 THEN 'Queens'
        WHEN 6 THEN 'Long Island'
        WHEN 7 THEN 'New Jersey'
        WHEN 8 THEN 'Manhattan'
        WHEN 9 THEN 'Brooklyn'
        ELSE city
    END,
    state = CASE id
        WHEN 1 THEN 'NY'
        WHEN 2 THEN 'NY'
        WHEN 3 THEN 'NY'
        WHEN 4 THEN 'NY'
        WHEN 5 THEN 'NY'
        WHEN 6 THEN 'NY'
        WHEN 7 THEN 'NJ'
        WHEN 8 THEN 'NY'
        WHEN 9 THEN 'NY'
        ELSE state
    END,
    address = CASE id
        WHEN 1 THEN '123 Fifth Avenue'
        WHEN 2 THEN '456 Maple Street'
        WHEN 3 THEN '789 Williamsburg Bridge'
        WHEN 4 THEN '321 Park Avenue'
        WHEN 5 THEN '654 Astoria Boulevard'
        WHEN 6 THEN '987 Garden City Road'
        WHEN 7 THEN '147 Hoboken Avenue'
        WHEN 8 THEN '258 East River Drive'
        WHEN 9 THEN '369 Brownstone Row'
        ELSE address
    END,
    price = CASE id
        WHEN 1 THEN 4500
        WHEN 2 THEN 3200
        WHEN 3 THEN 2800
        WHEN 4 THEN 8900
        WHEN 5 THEN 2400
        WHEN 6 THEN 3800
        WHEN 7 THEN 2900
        WHEN 8 THEN 5200
        WHEN 9 THEN 4100
        ELSE price
    END,
    bedrooms = CASE id
        WHEN 1 THEN 2
        WHEN 2 THEN 3
        WHEN 3 THEN 1
        WHEN 4 THEN 3
        WHEN 5 THEN 1
        WHEN 6 THEN 4
        WHEN 7 THEN 2
        WHEN 8 THEN 2
        WHEN 9 THEN 2
        ELSE bedrooms
    END,
    bathrooms = CASE id
        WHEN 1 THEN 2
        WHEN 2 THEN 2
        WHEN 3 THEN 1
        WHEN 4 THEN 3
        WHEN 5 THEN 1
        WHEN 6 THEN 3
        WHEN 7 THEN 1
        WHEN 8 THEN 2
        WHEN 9 THEN 2
        ELSE bathrooms
    END,
    square_feet = CASE id
        WHEN 1 THEN '1200'
        WHEN 2 THEN '1800'
        WHEN 3 THEN '650'
        WHEN 4 THEN '2500'
        WHEN 5 THEN '750'
        WHEN 6 THEN '2200'
        WHEN 7 THEN '900'
        WHEN 8 THEN '1400'
        WHEN 9 THEN '1100'
        ELSE square_feet
    END,
    property_type = CASE id
        WHEN 1 THEN 'apartment'
        WHEN 2 THEN 'townhouse'
        WHEN 3 THEN 'loft'
        WHEN 4 THEN 'penthouse'
        WHEN 5 THEN 'condo'
        WHEN 6 THEN 'house'
        WHEN 7 THEN 'apartment'
        WHEN 8 THEN 'apartment'
        WHEN 9 THEN 'apartment'
        ELSE property_type
    END,
    status = 'available',
    available_date = CASE id
        WHEN 1 THEN '2024-01-15'
        WHEN 2 THEN '2024-02-01'
        WHEN 3 THEN 'Available Now'
        WHEN 4 THEN '2024-03-01'
        WHEN 5 THEN 'Available Now'
        WHEN 6 THEN '2024-01-30'
        WHEN 7 THEN '2024-02-15'
        WHEN 8 THEN 'Available Now'
        WHEN 9 THEN '2024-02-10'
        ELSE available_date
    END,
    amenities = CASE id
        WHEN 1 THEN 'Gym, Pool, Concierge, Parking, Balcony'
        WHEN 2 THEN 'Backyard, Garage, Updated Kitchen, Near Schools'
        WHEN 3 THEN 'Exposed Brick, High Ceilings, Arts District'
        WHEN 4 THEN 'Rooftop Terrace, Valet Parking, City Views'
        WHEN 5 THEN 'Modern Kitchen, Granite Counters, Building Gym'
        WHEN 6 THEN 'Two-Car Garage, Basement, Large Yard'
        WHEN 7 THEN 'Private Patio, Garden Access, Recent Renovation'
        WHEN 8 THEN 'Fitness Center, Rooftop Pool, River Views'
        WHEN 9 THEN 'Historic Details, Modern Updates, Premium Location'
        ELSE amenities
    END,
    zip_code = CASE id
        WHEN 1 THEN 10001
        WHEN 2 THEN 10583
        WHEN 3 THEN 11249
        WHEN 4 THEN 10021
        WHEN 5 THEN 11106
        WHEN 6 THEN 11530
        WHEN 7 THEN 07030
        WHEN 8 THEN 10002
        WHEN 9 THEN 11201
        ELSE zip_code
    END,
    image_urls = CASE id
        WHEN 1 THEN '/src/assets/cdn/properties/luxury-downtown.webp'
        WHEN 2 THEN '/src/assets/cdn/properties/family-townhouse.webp'
        WHEN 3 THEN '/src/assets/cdn/properties/studio-loft.webp'
        WHEN 4 THEN '/src/assets/cdn/properties/luxury-downtown.webp'
        WHEN 5 THEN '/src/assets/cdn/properties/studio-loft.webp'
        WHEN 6 THEN '/src/assets/cdn/properties/family-townhouse.webp'
        WHEN 7 THEN '/src/assets/cdn/properties/family-townhouse.webp'
        WHEN 8 THEN '/src/assets/cdn/properties/luxury-downtown.webp'
        WHEN 9 THEN '/src/assets/cdn/properties/studio-loft.webp'
        ELSE image_urls
    END
WHERE id <= 9;

-- Insert additional properties if they don't exist
INSERT INTO public.properties (
    id, title, description, city, state, address, price, bedrooms, bathrooms, 
    square_feet, property_type, status, available_date, amenities, zip_code, image_urls
) VALUES 
    (1, 'Luxury Downtown Apartment', 'Stunning luxury apartment in the heart of downtown with floor-to-ceiling windows, modern amenities, and breathtaking city views. Features include stainless steel appliances, hardwood floors, and a private balcony.', 'New York', 'NY', '123 Fifth Avenue', 4500, 2, 2, '1200', 'apartment', 'available', '2024-01-15', 'Gym, Pool, Concierge, Parking, Balcony', 10001, '/src/assets/cdn/properties/luxury-downtown.webp'),
    (2, 'Family Townhouse in Suburb', 'Beautiful family townhouse in quiet suburban neighborhood. Perfect for families with children, featuring a spacious backyard, modern kitchen, and close proximity to top-rated schools and parks.', 'Westchester', 'NY', '456 Maple Street', 3200, 3, 2, '1800', 'townhouse', 'available', '2024-02-01', 'Backyard, Garage, Updated Kitchen, Near Schools', 10583, '/src/assets/cdn/properties/family-townhouse.webp'),
    (3, 'Modern Studio Loft', 'Stylish studio loft with exposed brick walls, high ceilings, and industrial-chic design. Located in trendy arts district with easy access to galleries, restaurants, and public transportation.', 'Brooklyn', 'NY', '789 Williamsburg Bridge', 2800, 1, 1, '650', 'loft', 'available', 'Available Now', 'Exposed Brick, High Ceilings, Arts District', 11249, '/src/assets/cdn/properties/studio-loft.webp')
ON CONFLICT (id) DO NOTHING;