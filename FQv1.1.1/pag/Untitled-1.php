<?php
// Datos de conexión a la base de datos
$servername = "tu_servidor";
$username = "tu_usuario";
$password = "tu_contraseña";
$dbname = "tu_base_de_datos";

// Datos para la tabla y el array
$tabla = "tu_tabla";
$datos = array("elemento1", "elemento2", "elemento3");

// Crear la conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar la conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Iterar sobre el array e insertar los elementos en la tabla
foreach ($datos as $elemento) {
    $sql = "INSERT INTO $tabla (nombre_columna) VALUES ('$elemento')";

    if ($conn->query($sql) === TRUE) {
        echo "Elemento '$elemento' insertado correctamente en la tabla.<br>";
    } else {
        echo "Error al insertar elemento '$elemento': " . $conn->error . "<br>";
    }
}

// Cerrar la conexión
$conn->close();
?>
