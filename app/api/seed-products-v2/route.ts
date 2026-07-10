import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { addDoc, collection, getDocs } from "firebase/firestore";

const NEW_PRODUCTS = [
	{ "name": "Carrot 500g", "category": "vegetables", "price": 30, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Cucumber 500g", "category": "vegetables", "price": 25, "stock": 45, "imageUrl": "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Beetroot 500g", "category": "vegetables", "price": 35, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1595484238892-13d2c9c3b6f9?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Brinjal 500g", "category": "vegetables", "price": 30, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1659261200833-ec8761558af7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Okra 500g", "category": "vegetables", "price": 35, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1631206691852-6cee9f753c5a?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Cabbage 1pc", "category": "vegetables", "price": 30, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Mango 1kg", "category": "fruits", "price": 120, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Pomegranate 1kg", "category": "fruits", "price": 150, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Watermelon 1pc", "category": "fruits", "price": 60, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Britannia Cheese Cubes 200g", "category": "dairy", "price": 120, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Mother Dairy Toned Milk 1L", "category": "dairy", "price": 66, "stock": 50, "imageUrl": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Yakult Probiotic Drink 5 Bottles", "category": "dairy", "price": 110, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Moong Dal Split 1kg", "category": "pulses", "price": 130, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Whole Green Moong 1kg", "category": "pulses", "price": 120, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Masoor Dal 1kg", "category": "pulses", "price": 110, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Whole Masoor 1kg", "category": "pulses", "price": 100, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Urad Dal Split 1kg", "category": "pulses", "price": 140, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Whole Urad 1kg", "category": "pulses", "price": 130, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Chana Dal 1kg", "category": "pulses", "price": 95, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Black Chana 1kg", "category": "pulses", "price": 90, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Kabuli Chana 1kg", "category": "pulses", "price": 110, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Rajma 1kg", "category": "pulses", "price": 150, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "White Rajma 1kg", "category": "pulses", "price": 160, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Lobia 1kg", "category": "pulses", "price": 100, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Matki 1kg", "category": "pulses", "price": 95, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Kulthi Dal 1kg", "category": "pulses", "price": 100, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Soybeans 1kg", "category": "pulses", "price": 90, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Mixed Sprouts 500g", "category": "pulses", "price": 50, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Jowar Flour 1kg", "category": "rice-and-grains", "price": 70, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Bajra Flour 1kg", "category": "rice-and-grains", "price": 65, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Ragi Flour 1kg", "category": "rice-and-grains", "price": 75, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Maize Flour 1kg", "category": "rice-and-grains", "price": 60, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Maida 1kg", "category": "rice-and-grains", "price": 50, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Suji 1kg", "category": "rice-and-grains", "price": 55, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Thick Poha 1kg", "category": "rice-and-grains", "price": 60, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Thin Poha 1kg", "category": "rice-and-grains", "price": 60, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Rolled Oats 1kg", "category": "rice-and-grains", "price": 150, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1517686748843-bb360cd75b70?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Barley 1kg", "category": "rice-and-grains", "price": 80, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Whole Wheat Grains 5kg", "category": "rice-and-grains", "price": 210, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Brown Rice 5kg", "category": "rice-and-grains", "price": 320, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Sona Masoori Rice 5kg", "category": "rice-and-grains", "price": 280, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Idli Rice 5kg", "category": "rice-and-grains", "price": 260, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Red Poha 1kg", "category": "rice-and-grains", "price": 70, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Corn Kernels 500g", "category": "vegetables", "price": 40, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1601593768799-76c1b6b40e0f?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Foxtail Millet 1kg", "category": "millets", "price": 110, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Little Millet 1kg", "category": "millets", "price": 100, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Barnyard Millet 1kg", "category": "millets", "price": 115, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Kodo Millet 1kg", "category": "millets", "price": 105, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Proso Millet 1kg", "category": "millets", "price": 110, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Whole Bajra 1kg", "category": "millets", "price": 75, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Whole Jowar 1kg", "category": "millets", "price": 75, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Whole Ragi 1kg", "category": "millets", "price": 85, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Fortune Rice Bran Oil 1L", "category": "cooking-oil", "price": 160, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Olive Oil Extra Virgin 500ml", "category": "cooking-oil", "price": 450, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Haldiram's Bhujia 400g", "category": "snacks", "price": 90, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Doritos Nacho Cheese 150g", "category": "snacks", "price": 80, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Pringles Original 110g", "category": "snacks", "price": 150, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Real Mixed Fruit Juice 1L", "category": "beverages", "price": 110, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Tropicana Apple Juice 1L", "category": "beverages", "price": 120, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Sprite 750ml", "category": "beverages", "price": 45, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Spaghetti Pasta 500g", "category": "international-pantry", "price": 90, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1551462147-37885acc36f1?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Sushi Rice 1kg", "category": "international-pantry", "price": 180, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Soy Sauce 500ml", "category": "international-pantry", "price": 150, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Peanut Butter 340g", "category": "international-pantry", "price": 220, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Vim Dishwash Liquid 500ml", "category": "household", "price": 95, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Surf Excel Detergent Powder 1kg", "category": "household", "price": 150, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Lizol Floor Cleaner 1L", "category": "household", "price": 180, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Garbage Bags", "category": "household", "price": 90, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Mother Dairy Milk 1L", "category": "dairy", "price": 66, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Nandini Milk 1L", "category": "dairy", "price": 60, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Aavin Milk 1L", "category": "dairy", "price": 58, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Heritage Milk 1L", "category": "dairy", "price": 62, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Britannia Butter 100g", "category": "dairy", "price": 58, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1589985270958-bf087b2d8ed7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Gowardhan Butter 100g", "category": "dairy", "price": 55, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1589985270958-bf087b2d8ed7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Nandini Butter 100g", "category": "dairy", "price": 52, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1589985270958-bf087b2d8ed7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Britannia Paneer 200g", "category": "dairy", "price": 95, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Mother Dairy Paneer 200g", "category": "dairy", "price": 90, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Gowardhan Paneer 200g", "category": "dairy", "price": 88, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Britannia Cheese Slices 200g", "category": "dairy", "price": 115, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Go Cheese Slices 200g", "category": "dairy", "price": 110, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Mother Dairy Curd 400g", "category": "dairy", "price": 42, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1571212967563-3e574f88a3a6?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Nandini Curd 400g", "category": "dairy", "price": 40, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1571212967563-3e574f88a3a6?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Heritage Curd 400g", "category": "dairy", "price": 42, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1571212967563-3e574f88a3a6?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Epigamia Yogurt 400g", "category": "dairy", "price": 85, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Nestle A+ Yogurt 400g", "category": "dairy", "price": 80, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Patanjali Ghee 500ml", "category": "dairy", "price": 230, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1631206753348-db44968fd440?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Gowardhan Ghee 500ml", "category": "dairy", "price": 240, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1631206753348-db44968fd440?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Verka Ghee 500ml", "category": "dairy", "price": 235, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1631206753348-db44968fd440?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Aashirvaad Atta 5kg", "category": "rice-and-grains", "price": 260, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Fortune Chakki Fresh Atta 5kg", "category": "rice-and-grains", "price": 250, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Pillsbury Atta 5kg", "category": "rice-and-grains", "price": 255, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Annapurna Atta 5kg", "category": "rice-and-grains", "price": 245, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Daawat Basmati Rice 5kg", "category": "rice-and-grains", "price": 520, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "India Gate Basmati Rice 5kg", "category": "rice-and-grains", "price": 540, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Lal Qilla Basmati Rice 5kg", "category": "rice-and-grains", "price": 480, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Kohinoor Basmati Rice 5kg", "category": "rice-and-grains", "price": 500, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Tata Sampann Toor Dal 1kg", "category": "pulses", "price": 165, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Fortune Toor Dal 1kg", "category": "pulses", "price": 160, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Organic Tattva Toor Dal 1kg", "category": "pulses", "price": 190, "stock": 20, "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Fortune Sunflower Oil 1L", "category": "cooking-oil", "price": 145, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Saffola Sunflower Oil 1L", "category": "cooking-oil", "price": 155, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Dhara Sunflower Oil 1L", "category": "cooking-oil", "price": 140, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Gemini Sunflower Oil 1L", "category": "cooking-oil", "price": 138, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Fortune Mustard Oil 1L", "category": "cooking-oil", "price": 155, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Dhara Mustard Oil 1L", "category": "cooking-oil", "price": 150, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Engine Mustard Oil 1L", "category": "cooking-oil", "price": 148, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Tata Salt 1kg", "category": "household", "price": 25, "stock": 50, "imageUrl": "https://images.unsplash.com/photo-1518110925495-7042ee39d5ec?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Aashirvaad Salt 1kg", "category": "household", "price": 24, "stock": 50, "imageUrl": "https://images.unsplash.com/photo-1518110925495-7042ee39d5ec?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Catch Salt 1kg", "category": "household", "price": 23, "stock": 50, "imageUrl": "https://images.unsplash.com/photo-1518110925495-7042ee39d5ec?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Madhur Sugar 1kg", "category": "household", "price": 48, "stock": 45, "imageUrl": "https://images.unsplash.com/photo-1610509182091-2c8b6a2ff2b8?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Trust Classic Sugar 1kg", "category": "household", "price": 46, "stock": 45, "imageUrl": "https://images.unsplash.com/photo-1610509182091-2c8b6a2ff2b8?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Dhampur Sugar 1kg", "category": "household", "price": 45, "stock": 45, "imageUrl": "https://images.unsplash.com/photo-1610509182091-2c8b6a2ff2b8?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Everest Turmeric Powder 100g", "category": "spices", "price": 28, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1615485291234-4b2f0a5b4f6c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "MDH Turmeric Powder 100g", "category": "spices", "price": 26, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1615485291234-4b2f0a5b4f6c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Catch Turmeric Powder 100g", "category": "spices", "price": 27, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1615485291234-4b2f0a5b4f6c?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Everest Red Chilli Powder 100g", "category": "spices", "price": 38, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1583119912267-cc97c911e416?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "MDH Red Chilli Powder 100g", "category": "spices", "price": 36, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1583119912267-cc97c911e416?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Catch Red Chilli Powder 100g", "category": "spices", "price": 37, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1583119912267-cc97c911e416?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Everest Coriander Powder 100g", "category": "spices", "price": 32, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "MDH Coriander Powder 100g", "category": "spices", "price": 30, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Catch Coriander Powder 100g", "category": "spices", "price": 31, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Everest Garam Masala 100g", "category": "spices", "price": 58, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "MDH Garam Masala 100g", "category": "spices", "price": 55, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Catch Garam Masala 100g", "category": "spices", "price": 56, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Tata Sampann Cumin Seeds 100g", "category": "spices", "price": 44, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Catch Cumin Seeds 100g", "category": "spices", "price": 42, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Britannia Bread 400g", "category": "bakery", "price": 45, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Harvest Gold Bread 400g", "category": "bakery", "price": 42, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Modern Bread 400g", "category": "bakery", "price": 40, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Happilo Cashew Nuts 200g", "category": "snacks", "price": 190, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Nutraj Cashew Nuts 200g", "category": "snacks", "price": 185, "stock": 25, "imageUrl": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Haldiram's Salted Peanuts 200g", "category": "snacks", "price": 50, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Bikaji Salted Peanuts 200g", "category": "snacks", "price": 48, "stock": 35, "imageUrl": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Real Orange Juice 1L", "category": "beverages", "price": 115, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Tropicana Orange Juice 1L", "category": "beverages", "price": 125, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "B Natural Orange Juice 1L", "category": "beverages", "price": 118, "stock": 30, "imageUrl": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Pepsi 750ml", "category": "beverages", "price": 45, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Thums Up 750ml", "category": "beverages", "price": 45, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400", "tags": [], "ecoHealthTag": null },
	{ "name": "Fanta 750ml", "category": "beverages", "price": 45, "stock": 40, "imageUrl": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400", "tags": [], "ecoHealthTag": null },
];

export async function GET() {
	try {
		const existingProductsSnapshot = await getDocs(collection(db, "products"));
		const existingNames = new Set(
			existingProductsSnapshot.docs.map((doc) => String(doc.data().name || "").toLowerCase()),
		);

		let added = 0;
		let skippedAsDuplicate = 0;

		for (const product of NEW_PRODUCTS) {
			const normalizedName = product.name.toLowerCase();

			if (existingNames.has(normalizedName)) {
				skippedAsDuplicate += 1;
				continue;
			}

			await addDoc(collection(db, "products"), {
				name: product.name,
				category: product.category,
				price: product.price,
				stock: product.stock,
				imageUrl: product.imageUrl,
				tags: [],
				ecoHealthTag: null,
			});

			existingNames.add(normalizedName);
			added += 1;
		}

		return NextResponse.json(
			{
				totalInList: NEW_PRODUCTS.length,
				added,
				skippedAsDuplicate,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Seeding products v2 failed:", error);
		return NextResponse.json({ error: "Seeding products v2 failed" }, { status: 500 });
	}
}
