import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
// import { useMemo } from 'react';

// Code pour extraire l'ensemble des colonnes pour les placer diréctement dans la table
// const columns = useMemo(() => {
//     if (!data || data.length === 0) {
//       return [];
//     }

//     const keys = Object.keys(data[0]);
//     const generColumns = keys.map((key) => ({
//       field: key,
//       headerName: key.charAt(0).toUpperCase() + key.slice(1),
//       flex: 1
//     }));

//     return generColumns;
//   }, [data]);

const columns = [
  { field: 'id', headerName: 'ID', width: 300 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'table_target', headerName: 'Table Target', flex: 1 },
  { field: 'table_target_id', headerName: 'Table Target ID', flex: 1 }
];

export default function RestrictionTable({ data, setData }) {
  const [rowSelectionModel, setRowSelectionModel] = React.useState([]);

  const test = (newRowSelectionModel) => {
    console.log('newRowSelectionModel : ' + newRowSelectionModel);
    setRowSelectionModel(newRowSelectionModel);
  };

  const rows = data.map((item) => ({
    id: item.id,
    name: item.name,
    table_target: item.table_target_id.split(':')[0],
    table_target_id: `${item.table_target_id.split(':')[1]}:${item.table_target_id.split(':')[2]}`
  }));

  const handleDelete = () => {
    // Utilisez selectedRows pour accéder aux lignes sélectionnées
    rowSelectionModel.forEach((row) => {
      axios
        .delete(`http://localhost:8085/v1/restrictions/${row}`, {
          headers: {
            accept: 'application/json'
          }
        })
        .then(() => {
          const updatedData = data.filter((item) => item.id !== row);
          setData(updatedData);
          console.log('Row deleted : ' + row);
        })
        .catch((error) => {
          // setResult(`Error : ${error.message}`);
          console.log(`Error : ${error.message}`);
        });
    });
  };

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 5 }
          }
        }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        disableSelectionOnClick // optionnel : désactive la sélection au clic sur la ligne
        autoHeight
        onRowSelectionModelChange={test}
        rowSelectionModel={rowSelectionModel}
      />
      <button onClick={handleDelete}>Supprimer les éléments sélectionnés</button>
    </div>
  );
}
