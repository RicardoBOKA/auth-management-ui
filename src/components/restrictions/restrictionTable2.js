import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
// import AddButton from '../shared/addButton';
// import RestrictionForm from './restrictionForm';

const columns = [
  { field: 'id', headerName: 'ID', width: 300 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'table_target', headerName: 'Table Target', flex: 1 },
  { field: 'table_target_id', headerName: 'Table Target ID', flex: 1 },
  { field: 'data', headerName: 'Data', flex: 1 },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    renderCell: (params) => (
      //rajouter restrictionform
      <Button variant="contained" color="primary" onClick={() => console.log('params row =', params.row)}>
        Modifier
      </Button>
    )
  }
];

export default function restrictionTable2({ data, setNewData }) {
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [changement, setChangement] = useState(true);
  // const [localData, setLocalData] = useState(data);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8085/v1/restrictions/', {
        headers: { Accept: 'application/json' }
      });
      // const parsedRestrictions = response.data.map((restriction) => ({
      //   ...restriction,
      //   parsedData: restriction.data ? JSON.parse(restriction.data) : null
      // }));
      setNewData(response.data);
    } catch (error) {
      console.error('Erreur lors de la requête GET :', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [changement]);

  const rowSelection = (newRowSelectionModel) => {
    // console.log('Selection : ');
    // newRowSelectionModel.forEach((element) => {
    //   console.log(element);
    // });
    setRowSelectionModel(newRowSelectionModel);
  };

  const rows = data.map((item) => ({
    id: item.id,
    name: item.name,
    data: item.data ? item.data : 'N/A',
    // data: item.parsedData ? item.parsedData.value : 'N/A',
    table_target: item.table_target_id.split(':')[0],
    table_target_id: `${item.table_target_id.split(':')[1]} ${
      item.table_target_id.split(':')[2] ? ':' + item.table_target_id.split(':')[2] : ''
    }`
  }));

  useEffect(() => {
    console.log('DATA = ' + data);
  }, []);

  const handleDelete = () => {
    let i = 0;
    rowSelectionModel.forEach((row) => {
      i++;
      axios
        .delete(`http://localhost:8085/v1/restrictions/${row}`, {
          headers: {
            accept: 'application/json'
          }
        })
        .then(() => {
          setChangement((changement) => !changement);
          console.log('Row deleted ' + 'i = ' + i + ' : ' + row);
        })
        .catch((error) => {
          console.log(`Error : ${error.message}`);
        });
    });
  };

  return (
    <div style={{ height: 800, width: 1200 }}>
      <div style={{ marginBottom: '20px' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 }
            }
          }}
          pageSizeOptions={[10, 20]}
          checkboxSelection
          disableSelectionOnClick // optionnel : désactive la sélection au clic sur la ligne
          autoHeight
          onRowSelectionModelChange={rowSelection}
          rowSelectionModel={rowSelectionModel}
        />
      </div>
      <Button variant="contained" color="primary" onClick={handleDelete}>
        Supprimer les éléments sélectionnés
      </Button>
    </div>
  );
}
