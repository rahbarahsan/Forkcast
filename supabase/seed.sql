-- seed.sql
-- Reference data for a fresh Forkcast project: recipes, their pre-parsed
-- ingredient lines, and the ingredient-normalisation lookup tables.
--
-- Generated from the live project's REST API. Re-runnable: every statement
-- is ON CONFLICT DO NOTHING, so seeding an already-populated database is a
-- no-op rather than an error.
--
-- Apply after the migrations in supabase/migrations/.

-- recipes (6 rows)
insert into public.recipes (id, title, cuisine, image, ingredients, instructions, prep_time, cook_time) values
  ('4aa01414-ff71-481f-bffa-0987665a0490', 'Authentic Mexican Chicken Enchiladas', 'Mexican', 'https://images.unsplash.com/photo-1679605097294-ad339b020c0f?q=80&w=1770&auto=format&fit=crop', ARRAY['12 corn tortillas', '3 cups cooked chicken, shredded', '2 cups enchilada sauce', '1 cup Mexican blend cheese, shredded', '1 onion, diced', '2 cloves garlic, minced', '1 bell pepper, diced', '1 tbsp vegetable oil', '1 tsp ground cumin', '1 tsp dried oregano', '1/2 tsp chili powder', 'Salt and pepper to taste', 'For garnish: cilantro, sour cream, avocado slices']::text[], 'Preheat oven to 375°F (190°C). Heat oil in a skillet, sauté onions, bell pepper, and garlic until soft. Add chicken, cumin, oregano, chili powder, salt, and pepper. Stir well. Warm tortillas briefly to make them pliable. Pour 1/4 cup enchilada sauce in a baking dish. Fill each tortilla with chicken mixture, roll up, and place seam-side down in dish. Pour remaining sauce over enchiladas and sprinkle with cheese. Bake for 20-25 minutes until bubbling and cheese is melted. Garnish with cilantro, sour cream, and avocado slices.', '20 mins', '25 mins'),
  ('80c9e121-37b9-474e-b1ad-05062b20d42e', 'Authentic Italian Risotto ai Funghi', 'Italian', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=1770&auto=format&fit=crop', ARRAY['320g Arborio rice', '300g mixed mushrooms (porcini, cremini, shiitake)', '1 onion, finely diced', '2 cloves garlic, minced', '150ml dry white wine', '1L vegetable or chicken stock, warm', '60g Parmesan cheese, grated', '30g butter', '2 tbsp olive oil', '2 tbsp fresh parsley, chopped', 'Salt and black pepper to taste']::text[], 'Heat stock in a separate pot. In a large pan, sauté onions in olive oil until translucent. Add garlic and mushrooms, cook until mushrooms release moisture. Add rice and toast for 2 minutes. Pour in wine and stir until absorbed. Add hot stock one ladle at a time, stirring frequently until absorbed before adding more. Continue until rice is creamy but still al dente (about 18-20 minutes). Remove from heat, stir in butter and Parmesan. Season with salt and pepper, garnish with parsley.', '15 mins', '25 mins'),
  ('94f64477-dca6-463e-9684-b77bfdc1ef02', 'Grilled Chicken Shawarma Bowl', 'Middle Eastern', 'https://images.unsplash.com/photo-1781334266250-a7e72fdf539f?q=80&w=1770&auto=format&fit=crop', ARRAY['500g boneless chicken thighs', '3 tbsp plain yogurt', '2 tbsp olive oil', '2 cloves garlic, minced', '1 tsp ground cumin', '1 tsp ground coriander', '1/2 tsp turmeric', '1/2 tsp paprika', '1/4 tsp ground cinnamon', 'Juice of 1 lemon', 'Salt and pepper to taste', 'Cooked rice or couscous (for serving)', 'Sliced cucumbers, cherry tomatoes, lettuce (for bowl)', 'Tahini sauce or garlic sauce (for drizzling)']::text[], 'Combine yogurt, olive oil, garlic, lemon juice, and all spices in a bowl. Add chicken and marinate for at least 1 hour (preferably overnight). Grill or pan-sear chicken until cooked through and slightly charred. Slice and serve over rice or couscous, with fresh veggies and tahini or garlic sauce.', '20 mins (+1 hr marination)', '15 mins'),
  ('9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', 'Thai Green Curry with Chicken', 'Thai', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=1770&auto=format&fit=crop', ARRAY['600g chicken thighs, sliced', '400ml coconut milk', '4 tbsp green curry paste', '2 Thai eggplants, quartered', '1 red bell pepper, sliced', '100g green beans, trimmed', '4 kaffir lime leaves', '2 tbsp fish sauce', '1 tbsp palm sugar', '1 handful Thai basil leaves', '2 red chilies, sliced (optional)', '2 tbsp vegetable oil', 'Jasmine rice, to serve']::text[], 'Heat oil in a wok or large skillet over medium heat. Add curry paste and cook for 1-2 minutes until fragrant. Add 1/4 of the coconut milk and simmer until oil separates. Add chicken and stir until coated with curry. Add remaining coconut milk, fish sauce, palm sugar, and kaffir lime leaves. Bring to a simmer. Add eggplants, bell pepper, and green beans. Cook for 10-15 minutes until chicken is cooked through and vegetables are tender. Stir in Thai basil leaves just before serving. Garnish with sliced red chilies if desired. Serve with jasmine rice.', '15 mins', '25 mins'),
  ('e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', 'Moroccan Chickpea Stew', 'Moroccan', 'https://images.unsplash.com/photo-1517314626714-ac1b9a16515e?q=80&w=1770&auto=format&fit=crop', ARRAY['2 tbsp olive oil', '1 onion, diced', '3 cloves garlic, minced', '2 carrots, diced', '1 red bell pepper, chopped', '1 zucchini, chopped', '1 tsp ground cumin', '1 tsp paprika', '1/2 tsp ground cinnamon', '1/4 tsp cayenne pepper (optional)', '400g canned chickpeas, drained and rinsed', '400g canned diced tomatoes', '2 cups vegetable broth', 'Salt and pepper to taste', 'Fresh cilantro, chopped (for garnish)']::text[], 'Heat olive oil in a large pot over medium heat. Sauté onion and garlic until fragrant. Add carrots, bell pepper, and zucchini; cook for 5 minutes. Stir in spices and toast for 1 minute. Add chickpeas, tomatoes, and broth. Simmer for 20–25 minutes until vegetables are tender and flavors meld. Season with salt and pepper. Garnish with fresh cilantro before serving.', '15 mins', '30 mins'),
  ('f9039a73-3e82-4d1f-8d6d-77caed807b4e', 'Butter Chicken (Murgh Makhani)', 'Indian', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1770&auto=format&fit=crop', ARRAY['800g boneless chicken thighs, cut into chunks', '2 tbsp vegetable oil', '2 onions, finely chopped', '4 cloves garlic, minced', '2 tbsp ginger, grated', '2 tbsp garam masala', '2 tsp ground cumin', '1 tbsp ground coriander', '1 tsp chili powder', '400g canned tomatoes', '200ml heavy cream', '50g unsalted butter', '1 tbsp honey', 'Salt to taste', 'Fresh coriander for garnish']::text[], 'Sauté onions until golden. Add garlic and ginger and cook for 2 minutes. Add all spices and cook for 1 minute. Add tomatoes and simmer for 15 minutes. Blend sauce until smooth. Return to pan, add chicken and simmer for 15-20 minutes. Stir in cream, butter, and honey. Season with salt and garnish with fresh coriander.', '20 mins', '40 mins')
on conflict (id) do nothing;

-- grocery_items_per_recipe (90 rows)
insert into public.grocery_items_per_recipe (id, recipe_id, raw_text, quantity, unit, name, modifiers, category, plural, needs_attention, synonym_of) values
  ('0107b71d-67c3-4b0d-b8e3-03c8a10a5360', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '1 tsp paprika', '1', 'tsp', 'paprika', '', 'Condiments & Spices', '', false, NULL),
  ('05f4fc1c-b97e-436c-945a-fa49b7fd360f', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '2 onions, finely chopped', '2', '', 'onions', 'finely chopped', 'Vegetables', 'onions', false, NULL),
  ('06c62382-0b0f-4fb7-911d-361fc573a436', '94f64477-dca6-463e-9684-b77bfdc1ef02', 'couscous (for serving)', '', '', 'couscous', 'for serving', 'Grains & Bakery', '', false, NULL),
  ('09088120-d139-4965-8c98-c15cbea70357', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '400g canned diced tomatoes', '400', 'g', 'tomatoes', 'canned, diced', 'Vegetables', 'tomato', false, NULL),
  ('0b6b2ed7-def4-4cb7-9129-d130d3dab149', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '1 tsp chili powder', '1', 'tsp', 'chili powder', '', 'Condiments & Spices', 'chili powders', false, NULL),
  ('0b9892c4-04e9-4593-bdfb-60801e8cc9fd', '4aa01414-ff71-481f-bffa-0987665a0490', '1 cup Mexican blend cheese, shredded', '1', 'cup', 'Mexican blend cheese', 'shredded', 'Dairy', '', false, NULL),
  ('0cbde7fa-92de-472e-b98b-9c9f557a35b4', '80c9e121-37b9-474e-b1ad-05062b20d42e', '150ml dry white wine', '150', 'ml', 'white wine', 'dry', 'Other', '', false, 'wine'),
  ('0ef0872b-9003-40aa-892c-348f7e9ca234', '4aa01414-ff71-481f-bffa-0987665a0490', '1 bell pepper, diced', '1', '', 'bell pepper', 'diced', 'Vegetables', 'bell peppers', false, 'capsicum'),
  ('0f04de7a-1fc8-4a0b-9621-348a44a92da0', '4aa01414-ff71-481f-bffa-0987665a0490', 'For garnish: cilantro, sour cream, avocado slices', '', '', 'cilantro', '', 'Condiments & Spices', '', false, 'coriander leaves'),
  ('0f7f514d-a13c-4f93-ae79-2590f92209a6', '80c9e121-37b9-474e-b1ad-05062b20d42e', '2 cloves garlic, minced', '2', 'cloves', 'garlic', 'minced', 'Vegetables', 'garlics', false, 'roshun'),
  ('1034401c-bf0a-4c2a-9c69-20cd4f6960b3', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '1 onion, diced', '1', '', 'onion', 'diced', 'Vegetables', 'onions', false, NULL),
  ('11432a29-f343-4686-93ee-6e2c7cd4a0de', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '4 tbsp green curry paste', '4', 'tbsp', 'green curry paste', 'green', 'Condiments & Spices', '', false, NULL),
  ('123ffd12-ff8e-4b3d-94e1-bf43acebfd1e', '4aa01414-ff71-481f-bffa-0987665a0490', '1 tbsp vegetable oil', '1', 'tbsp', 'vegetable oil', '', 'Condiments & Spices', '', false, 'cooking oil'),
  ('12c40cbd-5c1b-4a09-b562-89ca04d31e5d', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '1 handful Thai basil leaves', '1', 'handful', 'Thai basil leaves', 'Thai', 'Vegetables', 'Thai basil leaf', false, 'basil'),
  ('185b62bf-3bab-4c2f-b45e-f50661393154', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '200ml heavy cream', '200', 'ml', 'heavy cream', '', 'Dairy', '', false, 'whipping cream'),
  ('192047cb-f2d4-4f39-82d4-93c39a69a819', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '2 carrots, diced', '2', '', 'carrots', 'diced', 'Vegetables', 'carrot', false, NULL),
  ('1b03e378-8cfe-49b2-af99-5229183994c5', '80c9e121-37b9-474e-b1ad-05062b20d42e', '300g mixed mushrooms (porcini, cremini, shiitake)', '300', 'g', 'mushrooms', 'mixed (porcini, cremini, shiitake)', 'Vegetables', 'mushroom', false, NULL),
  ('1f23b91f-6de7-4b49-929e-63825333b4b3', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '50g unsalted butter', '50', 'g', 'butter', 'unsalted', 'Dairy', '', false, NULL),
  ('2211bb7b-41e2-4868-93be-6d23c1b7c587', '80c9e121-37b9-474e-b1ad-05062b20d42e', '2 tbsp fresh parsley, chopped', '2', 'tbsp', 'parsley', 'fresh, chopped', 'Vegetables', '', false, NULL),
  ('22a90b84-3ff5-4614-aa32-ab8423170ba0', '4aa01414-ff71-481f-bffa-0987665a0490', 'For garnish: cilantro, sour cream, avocado slices', '', '', 'cilantro', '', 'Condiments & Spices', '', false, 'coriander leaves'),
  ('241cd2c6-c34d-4263-b971-8f34f21b994b', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', 'Jasmine rice, to serve', '', '', 'rice', 'Jasmine, to serve', 'Grains & Bakery', '', false, NULL),
  ('250b88bb-0745-46b3-9a6b-84b1c5d4b15a', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '1 zucchini, chopped', '1', '', 'zucchini', 'chopped', 'Vegetables', 'zucchinis', false, NULL),
  ('2957fc88-0dfc-4b88-bcc6-6ced62fcb144', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '1 tbsp ground coriander', '', '', 'coriander', 'fresh, for garnish', 'Condiments & Spices', 'corianders', false, NULL),
  ('2c2a4c28-bac9-4415-bfd4-422173f671a3', '80c9e121-37b9-474e-b1ad-05062b20d42e', '320g Arborio rice', '320', 'g', 'Arborio rice', '', 'Grains & Bakery', '', false, NULL),
  ('2ec67fef-fa00-40d7-ae0c-c6f8ea8f2789', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '1 tsp ground cumin', '1', 'tsp', 'cumin', 'ground', 'Condiments & Spices', 'cumins', false, NULL),
  ('37e0bacf-04b4-451f-8552-9497d00f0c8d', '94f64477-dca6-463e-9684-b77bfdc1ef02', '1 tsp ground coriander', '1', 'tsp', 'coriander', 'ground', 'Condiments & Spices', '', false, NULL),
  ('3c29ed65-4f3d-4aa8-b6cc-ff621bce0ff7', '94f64477-dca6-463e-9684-b77bfdc1ef02', 'Sliced cucumbers, cherry tomatoes, lettuce (for bowl)', '', '', 'cucumbers', 'sliced', 'Vegetables', 'cucumber', false, NULL),
  ('40e46836-1606-4ab9-a37a-413f77cc7aa4', '80c9e121-37b9-474e-b1ad-05062b20d42e', 'chicken stock, warm', '', '', 'chicken stock', 'warm', 'Meat & Seafood', '', false, 'broth'),
  ('4229b791-64f3-45bc-a7bf-a8688a7940cd', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '2 red chilies, sliced (optional)', '2', '', 'red chilies', 'sliced (optional)', 'Condiments & Spices', 'red chili', false, 'red chili,red chilli,red chile'),
  ('42b0ad0c-ed21-4b4d-8338-d39acb9ce054', '94f64477-dca6-463e-9684-b77bfdc1ef02', 'Salt', '', '', 'salt', '', 'Condiments & Spices', 'salts', false, NULL),
  ('489a6b60-9846-4704-bb6e-41df10f9dd6c', '4aa01414-ff71-481f-bffa-0987665a0490', 'Salt', '', '', 'salt ', '', 'Condiments & Spices', '', false, NULL),
  ('4e60c7ac-2d83-47a3-ae22-c4bb5e9590e3', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '2 Thai eggplants, quartered', '2', '', 'Thai eggplant', 'quartered', 'Vegetables', 'Thai eggplants', false, 'eggplant'),
  ('50e8377c-2e24-4779-9b50-32a9f19e3f90', '4aa01414-ff71-481f-bffa-0987665a0490', '1 onion, diced', '1', '', 'onion', 'diced', 'Vegetables', 'onions', false, NULL),
  ('52856b7a-bb80-4105-ba26-d633d829fb2d', '80c9e121-37b9-474e-b1ad-05062b20d42e', '1 onion, finely diced', '1', '', 'onion', 'finely diced', 'Vegetables', 'onions', false, 'piyaj'),
  ('528b2c40-e349-4197-99d1-89dad3738979', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '2 tsp ground cumin', '2', 'tsp', 'cumin', 'ground', 'Condiments & Spices', 'cumins', false, NULL),
  ('568f8f2e-fdf3-43f9-8a0f-edd6ed8b2325', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '400g canned tomatoes', '400', 'g', 'tomatoes', 'canned', 'Vegetables', 'tomato', false, NULL),
  ('5807e4aa-24f7-46fd-9905-09b640123a70', '94f64477-dca6-463e-9684-b77bfdc1ef02', '2 cloves garlic, minced', '2', 'cloves', 'garlic', 'minced', 'Vegetables', 'garlics', false, NULL),
  ('6114323f-4f70-4e2c-b4d8-6e74d40cb95d', '4aa01414-ff71-481f-bffa-0987665a0490', '1 tsp ground cumin', '1', 'tsp', 'cumin', 'ground', 'Condiments & Spices', '', false, NULL),
  ('631c5de9-5b85-434c-9bdb-225ead88cf6d', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '800g boneless chicken thighs, cut into chunks', '800', 'g', 'chicken thigh', 'boneless, cut into chunks', 'Meat & Seafood', 'chicken thighs', false, 'chicken thighs'),
  ('63d81682-b095-45cd-9d35-f6591c1bcec9', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '1 red bell pepper, chopped', '1', '', 'red bell pepper', 'chopped', 'Vegetables', 'red bell peppers', false, 'bell pepper'),
  ('6423d810-91aa-4505-a8a9-0c1bb8d64106', '80c9e121-37b9-474e-b1ad-05062b20d42e', '2 tbsp olive oil', '2', 'tbsp', 'olive oil', '', 'Condiments & Spices', '', false, NULL),
  ('654a9bb7-b157-4590-9c44-ae36bfd960da', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '400ml coconut milk', '400', 'ml', 'coconut milk', '', 'Dairy', '', false, NULL),
  ('67667dbc-7f11-4462-9019-212bc74dfd03', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', 'Fresh coriander for garnish', '', '', 'coriander', 'fresh, for garnish', 'Condiments & Spices', 'corianders', false, NULL),
  ('688ff344-537b-445a-8656-ceb6b481e67e', '94f64477-dca6-463e-9684-b77bfdc1ef02', '1/2 tsp turmeric', '02-Jan', 'tsp', 'turmeric', '', 'Condiments & Spices', '', false, NULL),
  ('69162d59-53f1-4a2c-8310-752ba98690c0', '94f64477-dca6-463e-9684-b77bfdc1ef02', 'pepper to taste', '', '', 'pepper', 'to taste', 'Condiments & Spices', 'peppers', false, NULL),
  ('6aa877be-7902-41fe-9735-473f9c1b83f2', '80c9e121-37b9-474e-b1ad-05062b20d42e', '1L vegetable', '1', 'l', 'vegetable', '', 'Vegetables', '', false, NULL),
  ('6f227cc8-563a-49bd-94d7-8120087f8251', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '4 kaffir lime leaves', '4', '', 'kaffir lime leaves', 'kaffir', 'Condiments & Spices', 'kaffir lime leaf', false, 'makrut lime leaves'),
  ('7410eb2b-f1bc-4be6-bc65-56107e9111e8', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '1 tbsp palm sugar', '1', 'tbsp', 'palm sugar', '', 'Condiments & Spices', '', false, 'jaggery'),
  ('744eaefe-67a4-4f40-aa60-132dc9d4bd61', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '2 tbsp vegetable oil', '2', 'tbsp', 'vegetable oil', '', 'Condiments & Spices', '', false, 'cooking oil'),
  ('7495ba11-522a-4997-b340-2d697a9a2c69', '4aa01414-ff71-481f-bffa-0987665a0490', '12 corn tortillas', '12', '', 'corn tortilla', '', 'Grains & Bakery', 'corn tortillas', false, NULL),
  ('7514290f-16d5-4c32-9d7a-6f393551a858', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '600g chicken thighs, sliced', '600', 'g', 'chicken thighs', 'sliced', 'Meat & Seafood', 'chicken thigh', false, 'chicken'),
  ('814bdacb-9e92-4985-a98e-fbef628aeee7', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '1/2 tsp ground cinnamon', '0.5', 'tsp', 'cinnamon', 'ground', 'Condiments & Spices', 'cinnamons', false, NULL),
  ('81ca88cb-4112-43bd-913a-c64f250caf4e', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '2 cups vegetable broth', '2', 'cups', 'vegetable broth', '', 'Other', '', false, 'veggie broth,vegetable stock'),
  ('84ac5f4c-abb9-4cfb-a275-ca53d13da548', '94f64477-dca6-463e-9684-b77bfdc1ef02', '1 tsp ground cumin', '1', 'tsp', 'cumin', 'ground', 'Condiments & Spices', '', false, NULL),
  ('86c320e2-19d1-434a-856a-fa6925b18f7c', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '1/4 tsp cayenne pepper (optional)', '0.25', 'tsp', 'cayenne pepper', 'optional', 'Condiments & Spices', '', false, NULL),
  ('87f65bdb-1649-45bb-9730-5991a1efa158', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '2 tbsp garam masala', '2', 'tbsp', 'garam masala', '', 'Condiments & Spices', '', false, NULL),
  ('8ee2ec13-b587-4cfb-90a8-6b6cedb27463', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '4 cloves garlic, minced', '4', 'cloves', 'garlic', 'minced', 'Vegetables', 'garlics', false, NULL),
  ('93528691-e2fe-4388-95f2-e538df4d70d5', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '2 tbsp fish sauce', '2', 'tbsp', 'fish sauce', '', 'Condiments & Spices', '', false, NULL),
  ('95027fc0-fe55-471c-8bdd-82b5b10d5e75', '4aa01414-ff71-481f-bffa-0987665a0490', '3 cups cooked chicken, shredded', '3', 'cups', 'chicken', 'shredded', 'Meat & Seafood', 'chickens', false, 'murgi'),
  ('950341b3-8d78-4a04-853a-d25de1fc2c49', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '2 tbsp vegetable oil', '2', 'tbsp', 'vegetable oil', '', 'Condiments & Spices', '', false, 'cooking oil'),
  ('975b554f-94f4-4512-8672-1ece8fe33922', '80c9e121-37b9-474e-b1ad-05062b20d42e', 'Salt', '', '', 'salt', '', 'Condiments & Spices', '', false, 'lobon'),
  ('97b2462c-c0d8-41bc-84a9-c2eacca01837', '94f64477-dca6-463e-9684-b77bfdc1ef02', '500g boneless chicken thighs', '500', 'g', 'chicken thighs', 'boneless', 'Meat & Seafood', 'chicken thigh', false, NULL),
  ('9d8d9c71-bdae-428d-9975-25d95cfc01cc', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '2 tbsp olive oil', '2', 'tbsp', 'olive oil', '', 'Condiments & Spices', '', false, NULL),
  ('9f622ff7-2a9a-442e-95e6-854bc859cd6f', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '1 red bell pepper, sliced', '1', '', 'red bell pepper', 'sliced', 'Vegetables', 'red bell peppers', false, 'bell pepper, sweet pepper'),
  ('9f91cf90-4ecb-431a-95f7-756a4e5daa72', '94f64477-dca6-463e-9684-b77bfdc1ef02', 'Juice of 1 lemon', '1', '', 'lemon', 'juice of 1', 'Fruits', 'lemons', false, NULL),
  ('a6188fd3-5d4e-484f-b19a-41a1ce62fca1', '4aa01414-ff71-481f-bffa-0987665a0490', 'pepper to taste', '', '', 'pepper ', '', 'Condiments & Spices', '', false, NULL),
  ('ab5bfc2f-b1c6-423f-b517-23505323b8bc', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', 'Fresh cilantro, chopped (for garnish)', '', '', 'cilantro', 'fresh, chopped, for garnish', 'Condiments & Spices', '', false, 'coriander leaves'),
  ('b0824073-118f-4b35-9719-298405570702', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', 'Salt to taste', '', '', 'salt', 'to taste', 'Condiments & Spices', 'salts', false, NULL),
  ('b37fb618-2263-4d39-bc9a-6c2e4bfeb34d', '80c9e121-37b9-474e-b1ad-05062b20d42e', 'black pepper to taste', '', '', 'black pepper', 'to taste', 'Condiments & Spices', '', false, 'pepper'),
  ('b68444c8-327b-4a95-b406-6becbc669bd1', '94f64477-dca6-463e-9684-b77bfdc1ef02', 'Cooked rice', '', '', 'rice', 'cooked', 'Grains & Bakery', '', false, NULL),
  ('b900f545-01cb-4bf5-848a-0f9927ac5d9c', '94f64477-dca6-463e-9684-b77bfdc1ef02', 'Tahini sauce', '', '', 'tahini sauce', 'tahini', 'Condiments & Spices', '', false, NULL),
  ('b913fd98-7972-47c5-9076-28f0f597c0b2', '94f64477-dca6-463e-9684-b77bfdc1ef02', '1/4 tsp ground cinnamon', '04-Jan', 'tsp', 'cinnamon', 'ground', 'Condiments & Spices', '', false, NULL),
  ('c8842920-1af1-4555-b262-f6522e0b4d52', '4aa01414-ff71-481f-bffa-0987665a0490', '2 cloves garlic, minced', '2', 'cloves', 'garlic', 'minced', 'Vegetables', 'garlics', false, NULL),
  ('cc3dc372-222d-4737-8a01-20f6012e3a9f', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '2 tbsp ginger, grated', '2', 'tbsp', 'ginger', 'grated', 'Vegetables', '', false, NULL),
  ('d3bd9c8b-bca8-44b4-9442-7107f8279bfb', '4aa01414-ff71-481f-bffa-0987665a0490', '2 cups enchilada sauce', '2', 'cups', 'enchilada sauce', '', 'Condiments & Spices', '', false, NULL),
  ('d94ce546-1f16-4796-8d7f-bb04f68617b2', '4aa01414-ff71-481f-bffa-0987665a0490', '1/2 tsp chili powder', '02-Jan', 'tsp', 'chili powder', '', 'Condiments & Spices', '', false, NULL),
  ('da2301ed-4e7e-4296-89e4-091449bac146', '80c9e121-37b9-474e-b1ad-05062b20d42e', '60g Parmesan cheese, grated', '60', 'g', 'Parmesan cheese', 'grated', 'Dairy', '', false, 'Parmigiano-Reggiano'),
  ('df4cee22-6c2d-4b21-b4f0-3ab8c3e8a793', '80c9e121-37b9-474e-b1ad-05062b20d42e', '30g butter', '30', 'g', 'butter', '', 'Dairy', '', false, NULL),
  ('dfadb7f0-04fd-4ed9-bcba-0f6d5889d139', 'f9039a73-3e82-4d1f-8d6d-77caed807b4e', '1 tbsp honey', '1', 'tbsp', 'honey', '', 'Dairy', '', false, NULL),
  ('e08f2d73-4f79-4bc2-ba0b-f729cb0294f5', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '3 cloves garlic, minced', '3', 'cloves', 'garlic', 'minced', 'Vegetables', 'garlics', false, NULL),
  ('e76943ad-848e-4bc0-a0c9-dc34dc14db69', '94f64477-dca6-463e-9684-b77bfdc1ef02', '1/2 tsp paprika', '02-Jan', 'tsp', 'paprika', '', 'Condiments & Spices', '', false, NULL),
  ('e851bf04-0991-4c70-a6c6-c08b7024c835', '94f64477-dca6-463e-9684-b77bfdc1ef02', '2 tbsp olive oil', '2', 'tbsp', 'olive oil', '', 'Condiments & Spices', '', false, NULL),
  ('ecb93702-2db0-455a-8d18-e4809d2941f3', '4aa01414-ff71-481f-bffa-0987665a0490', '1 tsp dried oregano', '1', 'tsp', 'oregano', 'dried', 'Condiments & Spices', '', false, NULL),
  ('ecc052c6-c7a0-4bcd-9cbe-c7a9b3b3e7c1', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', '400g canned chickpeas, drained', '400', 'g', 'chickpeas', 'canned, drained', 'Grains & Bakery', '', false, NULL),
  ('ee76b688-af32-43c2-ba21-6ce8453e350c', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', 'Salt', '', '', 'salt', '', 'Condiments & Spices', 'salts', false, NULL),
  ('f2c07557-ad9e-4293-84ce-78b2dc7ac23f', 'e3c14ab9-f06d-4602-ac16-b0bf04d68dc4', 'pepper to taste', '', '', 'pepper', 'to taste', 'Condiments & Spices', 'peppers', false, NULL),
  ('f57d3895-bd4d-40d8-b772-209402553e34', '94f64477-dca6-463e-9684-b77bfdc1ef02', 'garlic sauce (for drizzling)', '', '', 'garlic sauce', 'for drizzling', 'Condiments & Spices', '', false, NULL),
  ('f718d2a8-3226-490d-a07e-6ce46c6ef492', '4aa01414-ff71-481f-bffa-0987665a0490', 'For garnish: cilantro, sour cream, avocado slices', '', '', 'cilantro', '', 'Condiments & Spices', '', false, 'coriander leaves'),
  ('f8af9c88-953d-49d6-9070-a4d985aaacca', '9efb4a43-f89d-4bfb-b3ee-e861bdcc5171', '100g green beans, trimmed', '100', 'g', 'green beans', 'trimmed', 'Vegetables', 'green bean', false, 'string beans,snap beans'),
  ('f9a513c8-0455-495d-92ab-642cc4410600', '94f64477-dca6-463e-9684-b77bfdc1ef02', '3 tbsp plain yogurt', '3', 'tbsp', 'yogurt', 'plain', 'Dairy', '', false, NULL)
on conflict (id) do nothing;

-- ingredient_lookup (45 rows)
insert into public.ingredient_lookup (canonical, synonyms, category, plurals) values
  ('apple', 'apple,seb', 'Fruits', 'apples'),
  ('banana', 'banana,kela,kola', 'Fruits', 'bannas'),
  ('bay leaves', 'bay leaves,tej patta,bayleaf', 'Condiments & Spices', NULL),
  ('beef', 'beef,gomash', 'Meat & Seafood', NULL),
  ('butter', 'butter,makhan', 'Dairy', NULL),
  ('cardamom', 'cardamom,elaichi', 'Condiments & Spices', NULL),
  ('cauliflower', 'cauliflower,gobhi', 'Vegetables', NULL),
  ('chicken', 'chicken,murgh,poultry', 'Meat & Seafood', NULL),
  ('chickpeas', 'chickpeas,chana,garbanzo beans', 'Grains & Bakery', 'chickpea'),
  ('chili powder', 'chili powder,red chili powder,lal mirch powder', 'Condiments & Spices', 'chili powders'),
  ('cinnamon', 'cinnamon,dalchini', 'Condiments & Spices', 'cinnamons'),
  ('cloves', 'cloves,laung', 'Condiments & Spices', NULL),
  ('coconut', 'coconut,nariyal,narikel', 'Other', NULL),
  ('coconut milk', 'coconut milk', 'Dairy', 'coconut milks'),
  ('coriander', 'coriander,dhaniya', 'Condiments & Spices', 'corianders'),
  ('cream', 'cream,malai,heavy cream', 'Dairy', NULL),
  ('cumin', 'cumin,jeera, jira', 'Condiments & Spices', 'cumins'),
  ('curry leaves', 'curry leaves,kari patta', 'Condiments & Spices', NULL),
  ('egg', 'egg,eggs,anda,dim', 'Meat & Seafood', 'eggs'),
  ('eggplant', 'eggplant,baingan,aubergine', 'Vegetables', 'eggplants'),
  ('fenugreek', 'fenugreek,methi', 'Condiments & Spices', NULL),
  ('flour', 'flour,atta,maida', 'Grains & Bakery', NULL),
  ('garam masala', 'garam masala', 'Condiments & Spices', 'garam masalas'),
  ('garlic', 'garlic,lahsun,garlic clove,garlic cloves', 'Vegetables', 'garlics'),
  ('ghee', 'ghee,clarified butter', 'Dairy', NULL),
  ('ginger', 'ginger,adrak', 'Vegetables', 'gingers'),
  ('green chili', 'green chili,hari mirch', 'Vegetables', NULL),
  ('kidney beans', 'kidney beans,rajma', 'Grains & Bakery', NULL),
  ('lentil', 'lentil,dal,moong dal,masoor dal,toor dal', 'Grains & Bakery', NULL),
  ('mango', 'mango,aam', 'Fruits', 'mangoes'),
  ('milk', 'milk,doodh', 'Dairy', NULL),
  ('mustard seeds', 'mustard seeds,rai', 'Condiments & Spices', NULL),
  ('oil', 'oil,cooking oil,mustard oil,olive oil,vegetable oil', 'Condiments & Spices', ''),
  ('okra', 'okra,bhindi', 'Vegetables', NULL),
  ('onion', 'onion,onions,pyaz,shallot,scallion,spring onion', 'Vegetables', 'onions'),
  ('paneer', 'paneer,indian cheese', 'Dairy', NULL),
  ('pepper', 'pepper,black pepper,kali mirch', 'Condiments & Spices', 'peppers'),
  ('potato', 'potato,aloo', 'Vegetables', NULL),
  ('rice', 'rice,basmati rice,chawal,brown rice,white rice', 'Grains & Bakery', 'rices'),
  ('salt', 'salt,namak,sea salt,table salt,lobon', 'Condiments & Spices', 'salts'),
  ('spinach', 'spinach,palak,shak', 'Vegetables', NULL),
  ('tamarind', 'tamarind,imli,tetul', 'Condiments & Spices', NULL),
  ('tomato', 'tomato,tomatoes,tamatar', 'Vegetables', NULL),
  ('turmeric', 'turmeric,haldi,holud', 'Condiments & Spices', 'turmerics'),
  ('yogurt', 'yogurt,dahi,curd', 'Dairy', 'yogurts')
on conflict (canonical) do nothing;

-- ingredient_weights (4 rows)
insert into public.ingredient_weights (item, grams_per_piece) values
  ('apple', 180),
  ('banana', 120),
  ('egg', 60),
  ('onion', 150)
on conflict (item) do nothing;

-- ingredient_exceptions (3 rows)
insert into public.ingredient_exceptions (plural, singular) values
  ('chilies', 'chili'),
  ('potatoes', 'potato'),
  ('tomatoes', 'tomato')
on conflict (plural) do nothing;

-- features (9 rows)
insert into public.features (id, title, icon, description, status, tier, image_url) values
  (1, 'Smart Grocery Aggregation', '🛒', 'Combine ingredients across all recipes', 'available', 'free', 'https://yourcdn.com/icons/grocery.png'),
  (2, 'Custom Recipe Entry', '✍️', 'Add any recipe with ingredients only', 'available', 'free', 'https://pmhjdiniwseslpczkokw.supabase.co/storage/v1/object/sign/features/add-icon.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkMTYwZTY4LWZhNTktNDc5Zi05MjE3LTA4NmM2YTA4YTcyNSJ9.eyJ1cmwiOiJmZWF0dXJlcy9hZGQtaWNvbi5wbmciLCJpYXQiOjE3NDQ3NjUwNzAsImV4cCI6MTc3NjMwMTA3MH0.9Eh5VgNjq0wZ6adbPA82UR0-SYAZaoO_dBI7GFY7ayQ'),
  (3, 'Pantry Tracker', '📦', 'Track what you already have', 'available', 'free', 'https://pmhjdiniwseslpczkokw.supabase.co/storage/v1/object/sign/features/pantry-icon.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkMTYwZTY4LWZhNTktNDc5Zi05MjE3LTA4NmM2YTA4YTcyNSJ9.eyJ1cmwiOiJmZWF0dXJlcy9wYW50cnktaWNvbi5wbmciLCJpYXQiOjE3NDQ3NjUwNTAsImV4cCI6MTc3NjMwMTA1MH0.RQqEfXhwuNPdHKecPUkeYiF4SMzr3liWBj84iiTWGJI'),
  (4, 'AI Meal Planning', '🧠', 'Let AI create your weekly plan', 'coming_soon', 'premium', 'https://yourcdn.com/icons/ai-plan.png'),
  (5, 'Recipe Scout', '📺', 'Extract recipes from YouTube links', 'coming_soon', 'premium', 'https://yourcdn.com/icons/youtube.png'),
  (6, 'Flyer-Based Optimization', '🛍️', 'Match items with store flyers', 'future', 'premium_plus', 'https://yourcdn.com/icons/flyer.png'),
  (7, 'Barcode Scan', '📷', 'Scan products into your pantry', 'future', 'premium_plus', 'https://yourcdn.com/icons/barcode.png'),
  (8, 'Cloud Sync', '☁️', 'Access your data from anywhere', 'coming_soon', 'premium', 'https://yourcdn.com/icons/cloud.png'),
  (9, 'Grocery Export', '📤', 'Share your grocery list via text', 'coming_soon', 'premium', 'https://yourcdn.com/icons/share.png')
on conflict (id) do nothing;
