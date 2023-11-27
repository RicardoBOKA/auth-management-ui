import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import axios from 'axios';

export default function RestrictionTable({ data }) {
  const [selectedRows, setSelectedRows] = useState([]);

  const handleRowClick = (id) => {
    const selectedIndex = selectedRows.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedRows, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedRows.slice(1));
    } else if (selectedIndex === selectedRows.length - 1) {
      newSelected = newSelected.concat(selectedRows.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selectedRows.slice(0, selectedIndex), selectedRows.slice(selectedIndex + 1));
    }

    setSelectedRows(newSelected);
  };

  const deleteSelection = () => {
    selectedRows.forEach((selectedRow) => {
      axios
        .delete(`http://localhost:8085/v1/restrictions/${selectedRow.id}`, {
          headers: {
            accept: 'application/json'
          }
        })
        .then(() => {
          //   fetchData();
          console.log('SElected row : ' + selectedRow.id);
        })
        .catch((error) => {
          //   setResult(`Error : ${error.message}`);
          console.log(`Error : ${error.message}`);
        });
    });
  };

  return (
    <TableContainer sx={{ marginLeft: 2, boxShadow: 2 }} component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Selection</TableCell>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Table Target</TableCell>
            <TableCell>Table Target ID</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Checkbox checked={selectedRows.indexOf(item.id) !== -1} onChange={() => handleRowClick(item.id)} />
              </TableCell>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.table_target_id.split(':')[0]}</TableCell>
              <TableCell>{item.table_target_id.split(':')[1] + item.table_target_id.split(':')[2]}</TableCell>
            </TableRow>
          ))}
          <button onClick={deleteSelection}>Supprimer les éléments sélectionnés</button>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
