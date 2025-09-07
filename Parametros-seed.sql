USE SistemaSalubridad;
GO

-- Semilla de parámetros analíticos
-- Agua - Fisicoquímicos
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'pH' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'pH', N'Agua', N'pH');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Conductividad' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Conductividad', N'Agua', N'µS/cm');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Sólidos disueltos totales (TDS)' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Sólidos disueltos totales (TDS)', N'Agua', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Turbidez' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Turbidez', N'Agua', N'NTU');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Color' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Color', N'Agua', N'UCV');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Olor' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Olor', N'Agua', N'-');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Sabor' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Sabor', N'Agua', N'-');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Dureza total (como CaCO3)' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Dureza total (como CaCO3)', N'Agua', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Alcalinidad total (como CaCO3)' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Alcalinidad total (como CaCO3)', N'Agua', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Cloruros' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Cloruros', N'Agua', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Sulfatos' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Sulfatos', N'Agua', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Nitratos (como NO3-)' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Nitratos (como NO3-)', N'Agua', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Nitritos (como NO2-)' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Nitritos (como NO2-)', N'Agua', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Amonio (como NH4+)' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Amonio (como NH4+)', N'Agua', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Oxígeno disuelto (OD)' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Oxígeno disuelto (OD)', N'Agua', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Demanda Bioquímica de Oxígeno (DBO5)' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Demanda Bioquímica de Oxígeno (DBO5)', N'Agua', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Demanda Química de Oxígeno (DQO)' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Demanda Química de Oxígeno (DQO)', N'Agua', N'mg/L');

-- Agua - Microbiológicos
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Recuento de Aerobios Mesófilos' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Recuento de Aerobios Mesófilos', N'Agua', N'UFC/mL');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Coliformes totales' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Coliformes totales', N'Agua', N'NMP/100 mL');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Escherichia coli (E. coli)' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Escherichia coli (E. coli)', N'Agua', N'NMP/100 mL');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Pseudomonas aeruginosa' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Pseudomonas aeruginosa', N'Agua', N'Presencia/Ausencia');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Enterococos' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Enterococos', N'Agua', N'UFC/100 mL');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Salmonella spp.' AND tipo_muestra = N'Agua')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Salmonella spp.', N'Agua', N'Presencia/Ausencia');

-- Alimento (ejemplos mínimos)
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Humedad' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Humedad', N'Alimento', N'%');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Proteína' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Proteína', N'Alimento', N'%');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Grasa' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Grasa', N'Alimento', N'%');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Coliformes totales' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Coliformes totales', N'Alimento', N'UFC/g');

-- Alimento - Adicionales (fisicoquímicos y microbiológicos)
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Carbohidratos' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Carbohidratos', N'Alimento', N'%');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Cenizas' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Cenizas', N'Alimento', N'%');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Fibra dietaria' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Fibra dietaria', N'Alimento', N'%');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Energía' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Energía', N'Alimento', N'kcal/100 g');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Actividad de agua (Aw)' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Actividad de agua (Aw)', N'Alimento', N'-');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'pH' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'pH', N'Alimento', N'pH');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Sal (como NaCl)' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Sal (como NaCl)', N'Alimento', N'%');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Sodio' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Sodio', N'Alimento', N'mg/100 g');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Azúcares totales' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Azúcares totales', N'Alimento', N'%');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Azúcares reductores' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Azúcares reductores', N'Alimento', N'%');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Acidez titulable (como ácido láctico)' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Acidez titulable (como ácido láctico)', N'Alimento', N'%');
-- Microbiológicos comunes en alimentos
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Mohos y levaduras' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Mohos y levaduras', N'Alimento', N'UFC/g');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Coliformes fecales' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Coliformes fecales', N'Alimento', N'UFC/g');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Staphylococcus aureus' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Staphylococcus aureus', N'Alimento', N'UFC/g');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Listeria monocytogenes' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Listeria monocytogenes', N'Alimento', N'Presencia/Ausencia en 25 g');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Salmonella spp. (25 g)' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Salmonella spp. (25 g)', N'Alimento', N'Presencia/Ausencia en 25 g');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Bacillus cereus' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Bacillus cereus', N'Alimento', N'UFC/g');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Clostridium perfringens' AND tipo_muestra = N'Alimento')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Clostridium perfringens', N'Alimento', N'UFC/g');

-- Bebida alcohólica (ejemplos mínimos)
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Alcohol' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Alcohol', N'Bebida', N'% v/v');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'pH' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'pH', N'Bebida', N'pH');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Azúcares totales' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Azúcares totales', N'Bebida', N'g/L');
GO

-- Bebida alcohólica - Adicionales (fisicoquímicos y microbiológicos)
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Densidad a 20°C' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Densidad a 20°C', N'Bebida', N'g/mL');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Extracto seco' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Extracto seco', N'Bebida', N'g/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Acidez total (como ácido tartárico)' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Acidez total (como ácido tartárico)', N'Bebida', N'g/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Acidez volátil (como ácido acético)' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Acidez volátil (como ácido acético)', N'Bebida', N'g/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Dióxido de azufre libre (SO₂ libre)' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Dióxido de azufre libre (SO₂ libre)', N'Bebida', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Dióxido de azufre total (SO₂ total)' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Dióxido de azufre total (SO₂ total)', N'Bebida', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Metanol' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Metanol', N'Bebida', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Furfural' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Furfural', N'Bebida', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Alcoholes superiores' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Alcoholes superiores', N'Bebida', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Ésteres' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Ésteres', N'Bebida', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Aldehídos (como acetaldehído)' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Aldehídos (como acetaldehído)', N'Bebida', N'mg/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Congéneres totales' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Congéneres totales', N'Bebida', N'mg/100 mL AA');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Dióxido de carbono (CO₂)' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Dióxido de carbono (CO₂)', N'Bebida', N'g/L');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Turbidez' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Turbidez', N'Bebida', N'NTU');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Color' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Color', N'Bebida', N'EBC');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Índice de amargor (IBU)' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Índice de amargor (IBU)', N'Bebida', N'IBU');
-- Microbiológicos en bebidas
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Mohos y levaduras' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Mohos y levaduras', N'Bebida', N'UFC/mL');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Recuento de Aerobios Mesófilos' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Recuento de Aerobios Mesófilos', N'Bebida', N'UFC/mL');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Coliformes totales' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Coliformes totales', N'Bebida', N'NMP/100 mL');
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE nombre = N'Escherichia coli (E. coli)' AND tipo_muestra = N'Bebida')
    INSERT INTO dbo.Parametro (nombre, tipo_muestra, unidad) VALUES (N'Escherichia coli (E. coli)', N'Bebida', N'NMP/100 mL');

-- =============================================================
-- Normas de referencia y límites para mostrar en Evaluador
-- Preferencia: Normas locales (Rep. Dominicana). En su ausencia, guías OMS/WHO o Codex (orientativas).
-- Este bloque es orientativo y no sustituye la normativa oficial vigente.
-- =============================================================

-- Agua para consumo humano (WHO/NORDOM orientativo)
DECLARE @id_norma_agua INT;
SELECT @id_norma_agua = id_norma
FROM dbo.NormaReferencia
WHERE descripcion = N'Guía de calidad de agua para consumo humano' AND tipo_muestra = N'Agua';
IF @id_norma_agua IS NULL
BEGIN
    INSERT INTO dbo.NormaReferencia (descripcion, fuente, tipo_muestra)
    VALUES (N'Guía de calidad de agua para consumo humano', N'OMS (WHO) y referencias NORDOM', N'Agua');
    SET @id_norma_agua = SCOPE_IDENTITY();
END

DECLARE @pid INT;

-- pH: 6.5 - 8.5
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'pH' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'BETWEEN', 6.5, 8.5);

-- Turbidez: <= 5 NTU
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Turbidez' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'<=', NULL, 5);

-- Sólidos Disueltos Totales (TDS): <= 1000 mg/L (criterio estético)
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Sólidos disueltos totales (TDS)' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'<=', NULL, 1000);

-- Cloruros: <= 250 mg/L (criterio estético)
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Cloruros' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'<=', NULL, 250);

-- Sulfatos: <= 250 mg/L (criterio estético)
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Sulfatos' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'<=', NULL, 250);

-- Nitratos (NO3-): <= 50 mg/L
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Nitratos (como NO3-)' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'<=', NULL, 50);

-- Nitritos (NO2-): <= 0.2 mg/L
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Nitritos (como NO2-)' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'<=', NULL, 0.2);

-- Amonio (NH4+): <= 0.5 mg/L (indicador)
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Amonio (como NH4+)' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'<=', NULL, 0.5);

-- Coliformes totales: = 0 NMP/100 mL
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Coliformes totales' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'=', 0, 0);

-- Escherichia coli: = 0 NMP/100 mL
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Escherichia coli (E. coli)' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'=', 0, 0);

-- Enterococos: = 0 UFC/100 mL
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Enterococos' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'=', 0, 0);

-- Pseudomonas aeruginosa: = 0 (Presencia/Ausencia)
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Pseudomonas aeruginosa' AND tipo_muestra = N'Agua';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_agua)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_agua, N'=', 0, 0);

-- (Opcional) Salmonella spp. en agua: generalmente no aplicable en agua potable; se deja sin límite por defecto

-- Alimentos: presencia/ausencia para patógenos clave (Codex/OMS orientativo)
DECLARE @id_norma_alimento INT;
SELECT @id_norma_alimento = id_norma
FROM dbo.NormaReferencia
WHERE descripcion = N'Guía microbiológica de alimentos (orientativa)' AND tipo_muestra = N'Alimento';
IF @id_norma_alimento IS NULL
BEGIN
    INSERT INTO dbo.NormaReferencia (descripcion, fuente, tipo_muestra)
    VALUES (N'Guía microbiológica de alimentos (orientativa)', N'Codex Alimentarius (FAO/OMS)', N'Alimento');
    SET @id_norma_alimento = SCOPE_IDENTITY();
END

-- Salmonella spp. (25 g): Ausencia
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Salmonella spp. (25 g)' AND tipo_muestra = N'Alimento';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_alimento)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_alimento, N'=', 0, 0);

-- Listeria monocytogenes: Ausencia en 25 g (para alimentos listos para consumo)
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Listeria monocytogenes' AND tipo_muestra = N'Alimento';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_alimento)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_alimento, N'=', 0, 0);

-- Bebidas alcohólicas: microbiología en producto terminado (orientativo)
DECLARE @id_norma_bebida INT;
SELECT @id_norma_bebida = id_norma
FROM dbo.NormaReferencia
WHERE descripcion = N'Guía microbiológica para bebidas alcohólicas (orientativa)' AND tipo_muestra = N'Bebida';
IF @id_norma_bebida IS NULL
BEGIN
    INSERT INTO dbo.NormaReferencia (descripcion, fuente, tipo_muestra)
    VALUES (N'Guía microbiológica para bebidas alcohólicas (orientativa)', N'Buenas Prácticas/Referencias internacionales', N'Bebida');
    SET @id_norma_bebida = SCOPE_IDENTITY();
END

-- E. coli: = 0 NMP/100 mL
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Escherichia coli (E. coli)' AND tipo_muestra = N'Bebida';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_bebida)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_bebida, N'=', 0, 0);

-- Coliformes totales: = 0 NMP/100 mL
SELECT @pid = id_parametro FROM dbo.Parametro WHERE nombre = N'Coliformes totales' AND tipo_muestra = N'Bebida';
IF @pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ParametroNorma WHERE id_parametro = @pid AND id_norma = @id_norma_bebida)
    INSERT INTO dbo.ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo)
    VALUES (@pid, @id_norma_bebida, N'=', 0, 0);
